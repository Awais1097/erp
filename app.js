// app.js - Complete with all form methods
class TextileERPApp {
    constructor() {
        this.currentModule = 'dashboard';
        this.modal = new bootstrap.Modal(document.getElementById('formModal'));
        this.modules = {
            dashboard: this.loadDashboard.bind(this),
            inventory: this.showInventory.bind(this),
            purchase: this.showPurchase.bind(this),
            dying: this.showDying.bind(this),
            packing: this.showPacking.bind(this),
            sales: this.showSales.bind(this),
            accounts: this.showAccounts.bind(this),
            vouchers: this.showVouchers.bind(this),
            reports: this.showReports.bind(this),
            settings: this.showSettings.bind(this)
        };
        this.init();
    }

    async init() {
        await this.loadDashboard();
        this.setupSync();
        this.updateSyncStatus();
        
        // Auto-refresh every 30 seconds
        setInterval(() => this.updateSyncStatus(), 30000);
    }

    async showModule(moduleName) {
        this.currentModule = moduleName;
        const moduleTitle = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
        document.getElementById('module-title').textContent = moduleTitle;
        
        if (this.modules[moduleName]) {
            await this.modules[moduleName]();
        } else {
            console.error(`Module ${moduleName} not found`);
        }
    }

    async loadDashboard() {
        const content = `
            <div class="row">
                <div class="col-md-3 mb-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h5 class="card-title">Total Lots</h5>
                            <h2 class="card-text" id="total-lots">0</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h5 class="card-title">Active Lots</h5>
                            <h2 class="card-text" id="active-lots">0</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h5 class="card-title">This Month Sales</h5>
                            <h2 class="card-text" id="month-sales">₹0</h2>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h5 class="card-title">Pending Vouchers</h5>
                            <h2 class="card-text" id="pending-vouchers">0</h2>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Recent Stock Movements</h5>
                        </div>
                        <div class="card-body">
                            <div id="recent-movements">Loading...</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Lots by Stage</h5>
                        </div>
                        <div class="card-body">
                            <div id="lots-by-stage">Loading...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.updateDashboardStats();
    }

    async updateDashboardStats() {
        try {
            // Get total lots
            const lots = await schema.findDocs('lot');
            document.getElementById('total-lots').textContent = lots.length;
            
            // Get active lots
            const activeLots = lots.filter(lot => lot.status === 'active');
            document.getElementById('active-lots').textContent = activeLots.length;
            
            // Get this month sales
            const today = new Date();
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const sales = await schema.findDocs('sale');
            const monthSales = sales.filter(sale => sale.sale_date >= monthStart)
                .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
            document.getElementById('month-sales').textContent = `₹${monthSales.toLocaleString()}`;
            
            // Update recent movements
            const movements = await schema.findDocs('stock_movement');
            const recentMovements = movements.slice(-5).reverse();
            const movementsHtml = recentMovements.map(movement => `
                <div class="d-flex justify-content-between border-bottom py-2">
                    <div>
                        <small class="text-muted">${new Date(movement.movement_date).toLocaleDateString()}</small>
                        <div>${movement.reference_type || 'Movement'}: ${movement.qty} ${movement.uom}</div>
                    </div>
                    <span class="lot-tag ${movement.to_stage}-stage">${movement.to_stage}</span>
                </div>
            `).join('');
            document.getElementById('recent-movements').innerHTML = movementsHtml || 'No movements';
            
            // Update lots by stage
            const stageCounts = {};
            activeLots.forEach(lot => {
                stageCounts[lot.current_stage] = (stageCounts[lot.current_stage] || 0) + 1;
            });
            
            const stageHtml = Object.entries(stageCounts).map(([stage, count]) => `
                <div class="mb-2">
                    <div class="d-flex justify-content-between">
                        <span>${stage.charAt(0).toUpperCase() + stage.slice(1)}</span>
                        <span class="badge bg-primary">${count}</span>
                    </div>
                    <div class="progress" style="height: 5px;">
                        <div class="progress-bar" style="width: ${(count / activeLots.length) * 100}%"></div>
                    </div>
                </div>
            `).join('');
            document.getElementById('lots-by-stage').innerHTML = stageHtml || 'No lots';
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    setupSync() {
        try {
            if (typeof REMOTE_COUCHDB !== 'undefined' && REMOTE_COUCHDB) {
                const sync = db.sync(REMOTE_COUCHDB, {
                    live: true,
                    retry: true
                });
                
                sync.on('change', function(change) {
                    console.log('Sync change:', change);
                }).on('error', function(err) {
                    console.log('Sync error:', err);
                });
                
                return sync;
            }
        } catch (error) {
            console.log('Sync setup failed:', error);
        }
        return null;
    }

    // ============= INVENTORY MODULE =============
    async showInventory() {
        const content = `
            <div class="d-flex justify-content-between mb-4">
                <h4>Lot-Based Inventory</h4>
                <button class="btn btn-primary" onclick="app.showLotForm()">
                    <i class="bi bi-plus-circle"></i> New Lot
                </button>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Lot ID</th>
                                    <th>Product</th>
                                    <th>Current Stage</th>
                                    <th>Quantity</th>
                                    <th>UOM</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="lots-table-body">
                                Loading...
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.loadLotsTable();
    }

    async loadLotsTable() {
        try {
            const lots = await schema.findDocs('lot');
            const products = await schema.findDocs('product');
            const productMap = {};
            products.forEach(p => productMap[p._id] = p);
            
            const html = lots.map(lot => `
                <tr>
                    <td><strong>${lot.lot_number || lot._id.substr(-6)}</strong></td>
                    <td>${productMap[lot.current_product_id]?.product_name || 'N/A'}</td>
                    <td><span class="lot-tag ${lot.current_stage}-stage">${lot.current_stage}</span></td>
                    <td>${lot.current_qty}</td>
                    <td>${lot.uom}</td>
                    <td>
                        <span class="badge ${lot.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                            ${lot.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewLot('${lot._id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="app.editLot('${lot._id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            document.getElementById('lots-table-body').innerHTML = html || '<tr><td colspan="7">No lots found</td></tr>';
        } catch (error) {
            console.error('Error loading lots:', error);
            document.getElementById('lots-table-body').innerHTML = '<tr><td colspan="7">Error loading data</td></tr>';
        }
    }

    async showLotForm(lotId = null) {
        try {
            const products = await schema.findDocs('product');
            const productOptions = products.map(p => 
                `<option value="${p._id}">${p.product_name} (${p.category})</option>`
            ).join('');
            
            let lotData = {};
            if (lotId) {
                const lot = await db.get(lotId);
                lotData = lot;
            }
            
            const formHtml = `
                <form id="lotForm" onsubmit="return app.saveLot(event)">
                    ${lotId ? `<input type="hidden" id="lotId" value="${lotId}">` : ''}
                    <div class="mb-3">
                        <label class="form-label">Lot Number *</label>
                        <input type="text" class="form-control" id="lotNumber" 
                               value="${lotData.lot_number || ''}" required>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Initial Product *</label>
                            <select class="form-select" id="initialProductId" required>
                                <option value="">Select Product</option>
                                ${productOptions}
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Current Stage *</label>
                            <select class="form-select" id="currentStage" required>
                                <option value="gray" ${lotData.current_stage === 'gray' ? 'selected' : ''}>Gray</option>
                                <option value="dying" ${lotData.current_stage === 'dying' ? 'selected' : ''}>Dying</option>
                                <option value="packing" ${lotData.current_stage === 'packing' ? 'selected' : ''}>Packing</option>
                                <option value="sale" ${lotData.current_stage === 'sale' ? 'selected' : ''}>Sale</option>
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Quantity *</label>
                            <input type="number" class="form-control" id="currentQty" 
                                   value="${lotData.current_qty || 0}" step="0.01" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">UOM *</label>
                            <select class="form-select" id="uom" required>
                                <option value="meter" ${lotData.uom === 'meter' ? 'selected' : ''}>Meter</option>
                                <option value="thaan" ${lotData.uom === 'thaan' ? 'selected' : ''}>Thaan</option>
                                <option value="bag" ${lotData.uom === 'bag' ? 'selected' : ''}>Bag</option>
                                <option value="kg" ${lotData.uom === 'kg' ? 'selected' : ''}>KG</option>
                            </select>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="status">
                            <option value="active" ${lotData.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="completed" ${lotData.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="hold" ${lotData.status === 'hold' ? 'selected' : ''}>Hold</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">${lotId ? 'Update' : 'Save'} Lot</button>
                </form>
            `;
            
            document.getElementById('modalTitle').textContent = 
                lotId ? 'Edit Lot' : 'Create New Lot';
            document.getElementById('modalBody').innerHTML = formHtml;
            
            if (lotId && lotData.initial_product_id) {
                document.getElementById('initialProductId').value = lotData.initial_product_id;
            }
            
            this.modal.show();
        } catch (error) {
            console.error('Error showing lot form:', error);
            this.showToast('Error loading form: ' + error.message, 'danger');
        }
    }

    async saveLot(event) {
        event.preventDefault();
        
        try {
            const lotId = document.getElementById('lotId')?.value;
            const lotData = {
                lot_number: document.getElementById('lotNumber').value,
                initial_product_id: document.getElementById('initialProductId').value,
                current_product_id: document.getElementById('initialProductId').value,
                current_stage: document.getElementById('currentStage').value,
                current_qty: parseFloat(document.getElementById('currentQty').value),
                uom: document.getElementById('uom').value,
                status: document.getElementById('status').value
            };
            
            if (lotId) {
                const existing = await db.get(lotId);
                await schema.updateDoc({ ...existing, ...lotData });
                this.showToast('Lot updated successfully!', 'success');
            } else {
                await schema.createDoc('lot', lotData);
                this.showToast('Lot created successfully!', 'success');
            }
            
            this.modal.hide();
            await this.loadLotsTable();
        } catch (error) {
            console.error('Error saving lot:', error);
            this.showToast('Error saving lot: ' + error.message, 'danger');
        }
    }

    async viewLot(lotId) {
        // Implementation for viewing lot details
        this.showToast('View lot details for: ' + lotId, 'info');
    }

    async editLot(lotId) {
        await this.showLotForm(lotId);
    }

    // ============= PURCHASE MODULE =============
    async showPurchase() {
        const content = `
            <div class="d-flex justify-content-between mb-4">
                <h4>Gray Cloth Purchase</h4>
                <button class="btn btn-primary" onclick="app.showPurchaseForm()">
                    <i class="bi bi-cart-plus"></i> New Purchase
                </button>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Purchase #</th>
                                    <th>Supplier</th>
                                    <th>Date</th>
                                    <th>Total Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="purchase-table-body">
                                Loading...
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.loadPurchasesTable();
    }

    async loadPurchasesTable() {
        try {
            const purchases = await schema.findDocs('purchase');
            const accounts = await schema.findDocs('account');
            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);
            
            const html = purchases.map(purchase => `
                <tr>
                    <td>PUR-${purchase.purchase_number || purchase._id.substr(-6)}</td>
                    <td>${accountMap[purchase.supplier_account_id]?.account_name || 'N/A'}</td>
                    <td>${new Date(purchase.purchase_date).toLocaleDateString()}</td>
                    <td>₹${purchase.total_amount?.toLocaleString() || '0'}</td>
                    <td>
                        <span class="badge ${purchase.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                            ${purchase.status || 'pending'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewPurchase('${purchase._id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            document.getElementById('purchase-table-body').innerHTML = html || '<tr><td colspan="6">No purchases found</td></tr>';
        } catch (error) {
            console.error('Error loading purchases:', error);
        }
    }

    async showPurchaseForm() {
        try {
            const suppliers = (await schema.findDocs('account'))
                .filter(acc => acc.account_type === 'supplier');
            const products = await schema.findDocs('product');
            
            const supplierOptions = suppliers.map(s => 
                `<option value="${s._id}">${s.account_name}</option>`
            ).join('');
            
            const productOptions = products.filter(p => p.category === 'gray').map(p => 
                `<option value="${p._id}">${p.product_name}</option>`
            ).join('');
            
            const formHtml = `
                <form id="purchaseForm" onsubmit="return app.savePurchase(event)">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Purchase Number *</label>
                            <input type="text" class="form-control" id="purchaseNumber" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Supplier *</label>
                            <select class="form-select" id="supplierId" required>
                                <option value="">Select Supplier</option>
                                ${supplierOptions}
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Date *</label>
                            <input type="date" class="form-control" id="purchaseDate" required 
                                   value="${new Date().toISOString().split('T')[0]}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Reference No</label>
                            <input type="text" class="form-control" id="referenceNo">
                        </div>
                    </div>
                    
                    <h6 class="mt-4 mb-3">Purchase Items</h6>
                    <div id="purchaseItems">
                        <div class="purchase-item row g-3 mb-3 border p-3 rounded">
                            <div class="col-md-4">
                                <label class="form-label">Product *</label>
                                <select class="form-select product-select" required>
                                    <option value="">Select Product</option>
                                    ${productOptions}
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Quantity *</label>
                                <input type="number" class="form-control qty-input" step="0.01" required>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">UOM *</label>
                                <select class="form-select uom-select" required>
                                    <option value="meter">Meter</option>
                                    <option value="thaan">Thaan</option>
                                </select>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Rate *</label>
                                <input type="number" class="form-control rate-input" step="0.01" required>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label">Total</label>
                                <input type="text" class="form-control total-display" readonly>
                            </div>
                        </div>
                    </div>
                    
                    <button type="button" class="btn btn-sm btn-outline-secondary mb-3" onclick="app.addPurchaseItem()">
                        <i class="bi bi-plus"></i> Add Item
                    </button>
                    
                    <div class="row mt-3">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Narration</label>
                                <textarea class="form-control" id="narration" rows="2"></textarea>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <div class="d-flex justify-content-between">
                                        <strong>Total Amount:</strong>
                                        <span id="purchaseTotal">₹0.00</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Save Purchase</button>
                </form>
            `;
            
            document.getElementById('modalTitle').textContent = 'New Purchase';
            document.getElementById('modalBody').innerHTML = formHtml;
            
            // Add event listeners for calculations
            this.setupPurchaseCalculations();
            this.modal.show();
        } catch (error) {
            console.error('Error showing purchase form:', error);
            this.showToast('Error loading form: ' + error.message, 'danger');
        }
    }

    setupPurchaseCalculations() {
        const calculateTotals = () => {
            let total = 0;
            document.querySelectorAll('.purchase-item').forEach(item => {
                const qty = parseFloat(item.querySelector('.qty-input').value) || 0;
                const rate = parseFloat(item.querySelector('.rate-input').value) || 0;
                const itemTotal = qty * rate;
                if (item.querySelector('.total-display')) {
                    item.querySelector('.total-display').value = '₹' + itemTotal.toFixed(2);
                }
                total += itemTotal;
            });
            const totalElem = document.getElementById('purchaseTotal');
            if (totalElem) {
                totalElem.textContent = '₹' + total.toFixed(2);
            }
        };

        const modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.addEventListener('input', (e) => {
                if (e.target.classList.contains('qty-input') || e.target.classList.contains('rate-input')) {
                    calculateTotals();
                }
            });
        }
    }

    addPurchaseItem() {
        const itemsDiv = document.getElementById('purchaseItems');
        if (itemsDiv && itemsDiv.children.length > 0) {
            const newItem = itemsDiv.children[0].cloneNode(true);
            // Clear values
            newItem.querySelector('.product-select').value = '';
            newItem.querySelector('.qty-input').value = '';
            newItem.querySelector('.uom-select').value = 'meter';
            newItem.querySelector('.rate-input').value = '';
            newItem.querySelector('.total-display').value = '';
            itemsDiv.appendChild(newItem);
        }
    }

    async savePurchase(event) {
        event.preventDefault();
        
        try {
            const purchaseData = {
                purchase_number: document.getElementById('purchaseNumber').value,
                supplier_account_id: document.getElementById('supplierId').value,
                purchase_date: document.getElementById('purchaseDate').value,
                reference_no: document.getElementById('referenceNo').value,
                narration: document.getElementById('narration').value,
                status: 'completed',
                total_amount: parseFloat(document.getElementById('purchaseTotal').textContent.replace('₹', ''))
            };
            
            // Collect items
            const items = [];
            document.querySelectorAll('.purchase-item').forEach(item => {
                const productId = item.querySelector('.product-select').value;
                const qty = parseFloat(item.querySelector('.qty-input').value);
                const uom = item.querySelector('.uom-select').value;
                const rate = parseFloat(item.querySelector('.rate-input').value);
                
                if (productId && qty && rate) {
                    items.push({
                        product_id: productId,
                        qty: qty,
                        uom: uom,
                        rate: rate
                    });
                }
            });
            
            if (items.length === 0) {
                this.showToast('Please add at least one item', 'warning');
                return;
            }
            
            // Create purchase
            const purchase = await schema.createDoc('purchase', purchaseData);
            
            // Create lots for each item
            for (const item of items) {
                const lot = await schema.createDoc('lot', {
                    lot_number: `LOT-${Date.now()}`,
                    initial_product_id: item.product_id,
                    current_product_id: item.product_id,
                    current_stage: 'gray',
                    current_qty: item.qty,
                    uom: item.uom,
                    status: 'active',
                    source_purchase_id: purchase._id
                });
                
                // Create stock movement
                await schema.createDoc('stock_movement', {
                    lot_id: lot._id,
                    from_stage: 'supplier',
                    to_stage: 'gray',
                    qty: item.qty,
                    uom: item.uom,
                    rate: item.rate,
                    total_cost: item.qty * item.rate,
                    reference_type: 'purchase',
                    reference_id: purchase._id,
                    movement_date: new Date().toISOString()
                });
                
                // Create lot cost
                await schema.createDoc('lot_cost', {
                    lot_id: lot._id,
                    cost_type: 'purchase',
                    cost_per_mtr: item.rate,
                    total_cost: item.qty * item.rate
                });
            }
            
            this.modal.hide();
            await this.loadPurchasesTable();
            this.showToast('Purchase saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving purchase:', error);
            this.showToast('Error saving purchase: ' + error.message, 'danger');
        }
    }

    async viewPurchase(purchaseId) {
        this.showToast('View purchase details: ' + purchaseId, 'info');
    }

    // ============= DYING MODULE =============
    async showDying() {
        const content = `
            <div class="d-flex justify-content-between mb-4">
                <h4>Dying Process</h4>
                <button class="btn btn-primary" onclick="app.showDyingForm()">
                    <i class="bi bi-palette"></i> New Dying Order
                </button>
            </div>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6>Gray Stock Available</h6>
                        </div>
                        <div class="card-body">
                            <div id="gray-stock-list">Loading...</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Process #</th>
                                            <th>Lot</th>
                                            <th>Dying Party</th>
                                            <th>Issued Qty</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="dying-orders-body">
                                        Loading...
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.loadDyingData();
    }

    async loadDyingData() {
        try {
            // Load gray stock
            const grayLots = (await schema.findDocs('lot'))
                .filter(lot => lot.current_stage === 'gray' && lot.status === 'active');
            
            const grayStockHtml = grayLots.map(lot => `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <small class="text-muted">${lot.lot_number || lot._id.substr(-6)}</small>
                        <div>${lot.current_qty} ${lot.uom}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.useLotForDying('${lot._id}')">
                        <i class="bi bi-arrow-right"></i>
                    </button>
                </div>
            `).join('');
            
            document.getElementById('gray-stock-list').innerHTML = 
                grayStockHtml || '<div class="text-muted">No gray stock available</div>';
            
            // Load dying orders
            const dyingOrders = (await schema.findDocs('process_order'))
                .filter(order => order.process_type === 'dying');
            const accounts = await schema.findDocs('account');
            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);
            
            const ordersHtml = dyingOrders.map(order => `
                <tr>
                    <td>DYE-${order.process_number || order._id.substr(-6)}</td>
                    <td>${order.lot_id?.substr(-6) || 'N/A'}</td>
                    <td>${accountMap[order.party_account_id]?.account_name || 'N/A'}</td>
                    <td>${order.issued_qty} ${order.uom}</td>
                    <td>
                        <span class="badge ${order.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                            ${order.status || 'pending'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewProcessOrder('${order._id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${order.status !== 'completed' ? `
                            <button class="btn btn-sm btn-outline-success" onclick="app.completeDying('${order._id}')">
                                <i class="bi bi-check-circle"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
            
            document.getElementById('dying-orders-body').innerHTML = 
                ordersHtml || '<tr><td colspan="6">No dying orders found</td></tr>';
        } catch (error) {
            console.error('Error loading dying data:', error);
        }
    }

    async showDyingForm(lotId = null) {
        try {
            const dyingParties = (await schema.findDocs('account'))
                .filter(acc => acc.account_type === 'dying_party');
            
            const partyOptions = dyingParties.map(p => 
                `<option value="${p._id}">${p.account_name}</option>`
            ).join('');
            
            let lotInfo = '';
            if (lotId) {
                const lot = await db.get(lotId);
                lotInfo = `
                    <div class="alert alert-info">
                        Selected Lot: ${lot.lot_number || lot._id.substr(-6)} - 
                        Available: ${lot.current_qty} ${lot.uom}
                    </div>
                    <input type="hidden" id="lotId" value="${lotId}">
                `;
            }
            
            // Get gray lots for selection if no lotId provided
            let lotOptions = '';
            if (!lotId) {
                const grayLots = (await schema.findDocs('lot'))
                    .filter(lot => lot.current_stage === 'gray' && lot.status === 'active');
                lotOptions = grayLots.map(lot => 
                    `<option value="${lot._id}">${lot.lot_number || lot._id.substr(-6)} - ${lot.current_qty} ${lot.uom}</option>`
                ).join('');
            }
            
            const formHtml = `
                <form id="dyingForm" onsubmit="return app.saveDyingOrder(event)">
                    ${lotInfo}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Process Number *</label>
                            <input type="text" class="form-control" id="processNumber" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Dying Party *</label>
                            <select class="form-select" id="partyId" required>
                                <option value="">Select Dying Party</option>
                                ${partyOptions}
                            </select>
                        </div>
                    </div>
                    ${!lotId ? `
                    <div class="mb-3">
                        <label class="form-label">Select Lot *</label>
                        <select class="form-select" id="lotIdSelect" required>
                            <option value="">Select Lot</option>
                            ${lotOptions}
                        </select>
                    </div>
                    ` : ''}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Issued Quantity *</label>
                            <input type="number" class="form-control" id="issuedQty" step="0.01" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Cost per Meter *</label>
                            <input type="number" class="form-control" id="costPerMtr" step="0.01" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Color</label>
                        <input type="text" class="form-control" id="color">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Save Dying Order</button>
                </form>
            `;
            
            document.getElementById('modalTitle').textContent = 'New Dying Order';
            document.getElementById('modalBody').innerHTML = formHtml;
            this.modal.show();
        } catch (error) {
            console.error('Error showing dying form:', error);
            this.showToast('Error loading form: ' + error.message, 'danger');
        }
    }

    async useLotForDying(lotId) {
        await this.showDyingForm(lotId);
    }

    async saveDyingOrder(event) {
        event.preventDefault();
        
        try {
            const lotId = document.getElementById('lotId')?.value || 
                         document.getElementById('lotIdSelect')?.value;
            
            const processData = {
                process_type: 'dying',
                process_number: document.getElementById('processNumber').value,
                party_account_id: document.getElementById('partyId').value,
                lot_id: lotId,
                issued_qty: parseFloat(document.getElementById('issuedQty').value),
                process_cost_per_mtr: parseFloat(document.getElementById('costPerMtr').value),
                color: document.getElementById('color').value,
                remarks: document.getElementById('remarks').value,
                status: 'issued'
            };
            
            const lot = await db.get(lotId);
            
            // Check if sufficient stock
            if (processData.issued_qty > lot.current_qty) {
                throw new Error('Insufficient stock in lot');
            }
            
            // Create process order
            const order = await schema.createDoc('process_order', processData);
            
            // Update lot stage
            lot.current_stage = 'dying';
            lot.current_qty = processData.issued_qty;
            await schema.updateDoc(lot);
            
            // Create stock movement
            await schema.createDoc('stock_movement', {
                lot_id: lotId,
                from_stage: 'gray',
                to_stage: 'dying',
                qty: processData.issued_qty,
                uom: lot.uom,
                rate: processData.process_cost_per_mtr,
                total_cost: processData.issued_qty * processData.process_cost_per_mtr,
                reference_type: 'process_issue',
                reference_id: order._id,
                movement_date: new Date().toISOString()
            });
            
            this.modal.hide();
            await this.loadDyingData();
            this.showToast('Dying order created successfully!', 'success');
        } catch (error) {
            console.error('Error saving dying order:', error);
            this.showToast('Error: ' + error.message, 'danger');
        }
    }

    async completeDying(orderId) {
        try {
            const order = await db.get(orderId);
            const lot = await db.get(order.lot_id);
            
            const formHtml = `
                <form id="completeDyingForm" onsubmit="return app.saveCompleteDying(event, '${orderId}')">
                    <div class="mb-3">
                        <label class="form-label">Received Quantity *</label>
                        <input type="number" class="form-control" id="receivedQty" 
                               value="${order.issued_qty}" step="0.01" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Wastage</label>
                        <input type="number" class="form-control" id="wastage" step="0.01">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2"></textarea>
                    </div>
                    <button type="submit" class="btn btn-success">Complete Dying</button>
                </form>
            `;
            
            document.getElementById('modalTitle').textContent = 'Complete Dying Process';
            document.getElementById('modalBody').innerHTML = formHtml;
            this.modal.show();
        } catch (error) {
            console.error('Error showing complete dying form:', error);
            this.showToast('Error: ' + error.message, 'danger');
        }
    }

    async saveCompleteDying(event, orderId) {
        event.preventDefault();
        
        try {
            const receivedQty = parseFloat(document.getElementById('receivedQty').value);
            const wastage = parseFloat(document.getElementById('wastage').value) || 0;
            const remarks = document.getElementById('remarks').value;
            
            const order = await db.get(orderId);
            const lot = await db.get(order.lot_id);
            
            // Update process order
            order.received_qty = receivedQty;
            order.wastage = wastage;
            order.status = 'completed';
            order.completed_date = new Date().toISOString();
            await schema.updateDoc(order);
            
            // Update lot
            lot.current_qty = receivedQty;
            await schema.updateDoc(lot);
            
            // Create stock movement for completion
            await schema.createDoc('stock_movement', {
                lot_id: lot._id,
                from_stage: 'dying',
                to_stage: 'dying_completed',
                qty: receivedQty,
                uom: lot.uom,
                rate: order.process_cost_per_mtr,
                total_cost: receivedQty * order.process_cost_per_mtr,
                reference_type: 'process_complete',
                reference_id: order._id,
                movement_date: new Date().toISOString()
            });
            
            // Add dying cost to lot
            await schema.createDoc('lot_cost', {
                lot_id: lot._id,
                cost_type: 'dying',
                cost_per_mtr: order.process_cost_per_mtr,
                total_cost: receivedQty * order.process_cost_per_mtr
            });
            
            this.modal.hide();
            await this.loadDyingData();
            this.showToast('Dying process completed!', 'success');
        } catch (error) {
            console.error('Error completing dying:', error);
            this.showToast('Error: ' + error.message, 'danger');
        }
    }

    async viewProcessOrder(orderId) {
        this.showToast('View process order: ' + orderId, 'info');
    }

    // ============= PACKING MODULE =============
    async showPacking() {
        const content = `
            <div class="d-flex justify-content-between mb-4">
                <h4>Packing Process</h4>
                <button class="btn btn-primary" onclick="app.showPackingForm()">
                    <i class="bi bi-box"></i> New Packing Order
                </button>
            </div>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6>Dyed Stock Available</h6>
                        </div>
                        <div class="card-body">
                            <div id="dyed-stock-list">Loading...</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Process #</th>
                                            <th>Lot</th>
                                            <th>Packing Party</th>
                                            <th>Issued Qty</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="packing-orders-body">
                                        Loading...
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.loadPackingData();
    }

    async loadPackingData() {
        try {
            // Load dyed stock
            const dyedLots = (await schema.findDocs('lot'))
                .filter(lot => lot.current_stage === 'dying' && lot.status === 'active');
            
            const dyedStockHtml = dyedLots.map(lot => `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <small class="text-muted">${lot.lot_number || lot._id.substr(-6)}</small>
                        <div>${lot.current_qty} ${lot.uom}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.useLotForPacking('${lot._id}')">
                        <i class="bi bi-arrow-right"></i>
                    </button>
                </div>
            `).join('');
            
            document.getElementById('dyed-stock-list').innerHTML = 
                dyedStockHtml || '<div class="text-muted">No dyed stock available</div>';
            
            // Load packing orders
            const packingOrders = (await schema.findDocs('process_order'))
                .filter(order => order.process_type === 'packing');
            const accounts = await schema.findDocs('account');
            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);
            
            const ordersHtml = packingOrders.map(order => `
                <tr>
                    <td>PKG-${order.process_number || order._id.substr(-6)}</td>
                    <td>${order.lot_id?.substr(-6) || 'N/A'}</td>
                    <td>${accountMap[order.party_account_id]?.account_name || 'N/A'}</td>
                    <td>${order.issued_qty} ${order.uom}</td>
                    <td>
                        <span class="badge ${order.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                            ${order.status || 'pending'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewPackingOrder('${order._id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        ${order.status !== 'completed' ? `
                            <button class="btn btn-sm btn-outline-success" onclick="app.completePacking('${order._id}')">
                                <i class="bi bi-check-circle"></i>
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `).join('');
            
            document.getElementById('packing-orders-body').innerHTML = 
                ordersHtml || '<tr><td colspan="6">No packing orders found</td></tr>';
        } catch (error) {
            console.error('Error loading packing data:', error);
        }
    }

    async showPackingForm(lotId = null) {
        try {
            const packingParties = (await schema.findDocs('account'))
                .filter(acc => acc.account_type === 'packing_party');
            
            const partyOptions = packingParties.map(p => 
                `<option value="${p._id}">${p.account_name}</option>`
            ).join('');
            
            let lotInfo = '';
            if (lotId) {
                const lot = await db.get(lotId);
                lotInfo = `
                    <div class="alert alert-info">
                        Selected Lot: ${lot.lot_number || lot._id.substr(-6)} - 
                        Available: ${lot.current_qty} ${lot.uom}
                    </div>
                    <input type="hidden" id="lotId" value="${lotId}">
                `;
            }
            
            // Get dyed lots for selection if no lotId provided
            let lotOptions = '';
            if (!lotId) {
                const dyedLots = (await schema.findDocs('lot'))
                    .filter(lot => lot.current_stage === 'dying' && lot.status === 'active');
                lotOptions = dyedLots.map(lot => 
                    `<option value="${lot._id}">${lot.lot_number || lot._id.substr(-6)} - ${lot.current_qty} ${lot.uom}</option>`
                ).join('');
            }
            
            const formHtml = `
                <form id="packingForm" onsubmit="return app.savePackingOrder(event)">
                    ${lotInfo}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Process Number *</label>
                            <input type="text" class="form-control" id="processNumber" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Packing Party *</label>
                            <select class="form-select" id="partyId" required>
                                <option value="">Select Packing Party</option>
                                ${partyOptions}
                            </select>
                        </div>
                    </div>
                    ${!lotId ? `
                    <div class="mb-3">
                        <label class="form-label">Select Lot *</label>
                        <select class="form-select" id="lotIdSelect" required>
                            <option value="">Select Lot</option>
                            ${lotOptions}
                        </select>
                    </div>
                    ` : ''}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Issued Quantity *</label>
                            <input type="number" class="form-control" id="issuedQty" step="0.01" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Cost per Meter *</label>
                            <input type="number" class="form-control" id="costPerMtr" step="0.01" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Article Name</label>
                        <input type="text" class="form-control" id="articleName">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Save Packing Order</button>
                </form>
            `;
            
            document.getElementById('modalTitle').textContent = 'New Packing Order';
            document.getElementById('modalBody').innerHTML = formHtml;
            this.modal.show();
        } catch (error) {
            console.error('Error showing packing form:', error);
            this.showToast('Error loading form: ' + error.message, 'danger');
        }
    }

    async useLotForPacking(lotId) {
        await this.showPackingForm(lotId);
    }

    async savePackingOrder(event) {
        event.preventDefault();
        
        try {
            const lotId = document.getElementById('lotId')?.value || 
                         document.getElementById('lotIdSelect')?.value;
            
            const processData = {
                process_type: 'packing',
                process_number: document.getElementById('processNumber').value,
                party_account_id: document.getElementById('partyId').value,
                lot_id: lotId,
                issued_qty: parseFloat(document.getElementById('issuedQty').value),
                process_cost_per_mtr: parseFloat(document.getElementById('costPerMtr').value),
                article_name: document.getElementById('articleName').value,
                remarks: document.getElementById('remarks').value,
                status: 'issued'
            };
            
            const lot = await db.get(lotId);
            
            // Check if sufficient stock
            if (processData.issued_qty > lot.current_qty) {
                throw new Error('Insufficient stock in lot');
            }
            
            // Create process order
            const order = await schema.createDoc('process_order', processData);
            
            // Update lot stage
            lot.current_stage = 'packing';
            lot.current_qty = processData.issued_qty;
            await schema.updateDoc(lot);
            
            // Create stock movement
            await schema.createDoc('stock_movement', {
                lot_id: lotId,
                from_stage: 'dying',
                to_stage: 'packing',
                qty: processData.issued_qty,
                uom: lot.uom,
                rate: processData.process_cost_per_mtr,
                total_cost: processData.issued_qty * processData.process_cost_per_mtr,
                reference_type: 'process_issue',
                reference_id: order._id,
                movement_date: new Date().toISOString()
            });
            
            this.modal.hide();
            await this.loadPackingData();
            this.showToast('Packing order created successfully!', 'success');
        } catch (error) {
            console.error('Error saving packing order:', error);
            this.showToast('Error: ' + error.message, 'danger');
        }
    }

    async completePacking(orderId) {
        try {
            const order = await db.get(orderId);
            const lot = await db.get(order.lot_id);
            
            const formHtml = `
                <form id="completePackingForm" onsubmit="return app.saveCompletePacking(event, '${orderId}')">
                    <div class="mb-3">
                        <label class="form-label">Received Quantity *</label>
                        <input type="number" class="form-control" id="receivedQty" 
                               value="${order.issued_qty}" step="0.01" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Wastage</label>
                        <input type="number" class="form-control" id="wastage" step="0.01">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2"></textarea>
                    </div>
                    <button type="submit" class="btn btn-success">Complete Packing</button>
                </form>
            `;
            
            document.getElementById('modalTitle').textContent = 'Complete Packing Process';
            document.getElementById('modalBody').innerHTML = formHtml;
            this.modal.show();
        } catch (error) {
            console.error('Error showing complete packing form:', error);
            this.showToast('Error: ' + error.message, 'danger');
        }
    }

    async saveCompletePacking(event, orderId) {
        event.preventDefault();
        
        try {
            const receivedQty = parseFloat(document.getElementById('receivedQty').value);
            const wastage = parseFloat(document.getElementById('wastage').value) || 0;
            const remarks = document.getElementById('remarks').value;
            
            const order = await db.get(orderId);
            const lot = await db.get(order.lot_id);
            
            // Update process order
            order.received_qty = receivedQty;
            order.wastage = wastage;
            order.status = 'completed';
            order.completed_date = new Date().toISOString();
            await schema.updateDoc(order);
            
            // Update lot
            lot.current_qty = receivedQty;
            // Update product if article name changed
            if (order.article_name && lot.current_product_id) {
                const product = await db.get(lot.current_product_id);
                if (product) {
                    product.product_name = order.article_name;
                    await schema.updateDoc(product);
                }
            }
            await schema.updateDoc(lot);
            
            // Create stock movement for completion
            await schema.createDoc('stock_movement', {
                lot_id: lot._id,
                from_stage: 'packing',
                to_stage: 'packing_completed',
                qty: receivedQty,
                uom: lot.uom,
                rate: order.process_cost_per_mtr,
                total_cost: receivedQty * order.process_cost_per_mtr,
                reference_type: 'process_complete',
                reference_id: order._id,
                movement_date: new Date().toISOString()
            });
            
            // Add packing cost to lot
            await schema.createDoc('lot_cost', {
                lot_id: lot._id,
                cost_type: 'packing',
                cost_per_mtr: order.process_cost_per_mtr,
                total_cost: receivedQty * order.process_cost_per_mtr
            });
            
            this.modal.hide();
            await this.loadPackingData();
            this.showToast('Packing process completed!', 'success');
        } catch (error) {
            console.error('Error completing packing:', error);
            this.showToast('Error: ' + error.message, 'danger');
        }
    }

    async viewPackingOrder(orderId) {
        this.showToast('View packing order: ' + orderId, 'info');
    }

    // ============= SALES MODULE =============
    async showSales() {
        const content = `
            <div class="d-flex justify-content-between mb-4">
                <h4>Sales Management</h4>
                <button class="btn btn-primary" onclick="app.showSalesForm()">
                    <i class="bi bi-cash-coin"></i> New Sale
                </button>
            </div>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6>Available Stock for Sale</h6>
                        </div>
                        <div class="card-body">
                            <div id="sale-stock-list">Loading...</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Invoice #</th>
                                            <th>Buyer</th>
                                            <th>Date</th>
                                            <th>Total Amount</th>
                                            <th>Profit</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="sales-table-body">
                                        Loading...
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.loadSalesData();
    }

    async loadSalesData() {
        try {
            // Load saleable stock (packed lots)
            const saleableLots = (await schema.findDocs('lot'))
                .filter(lot => lot.current_stage === 'packing' && lot.status === 'active');
            
            const stockHtml = saleableLots.map(lot => `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <small class="text-muted">${lot.lot_number || lot._id.substr(-6)}</small>
                        <div>${lot.current_qty} ${lot.uom}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="app.useLotForSale('${lot._id}')">
                        <i class="bi bi-cart"></i>
                    </button>
                </div>
            `).join('');
            
            document.getElementById('sale-stock-list').innerHTML = 
                stockHtml || '<div class="text-muted">No stock available for sale</div>';
            
            // Load sales
            const sales = await schema.findDocs('sale');
            const accounts = await schema.findDocs('account');
            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);
            
            const salesHtml = sales.map(sale => `
                <tr>
                    <td>INV-${sale.invoice_number || sale._id.substr(-6)}</td>
                    <td>${accountMap[sale.buyer_account_id]?.account_name || 'N/A'}</td>
                    <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
                    <td>₹${sale.total_amount?.toLocaleString() || '0'}</td>
                    <td>₹${sale.total_profit?.toLocaleString() || '0'}</td>
                    <td>
                        <span class="badge ${sale.status === 'completed' ? 'bg-success' : 'bg-warning'}">
                            ${sale.status}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewSale('${sale._id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-secondary" onclick="app.printInvoice('${sale._id}')">
                            <i class="bi bi-printer"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            document.getElementById('sales-table-body').innerHTML = 
                salesHtml || '<tr><td colspan="7">No sales found</td></tr>';
        } catch (error) {
            console.error('Error loading sales data:', error);
        }
    }

    async showSalesForm(lotId = null) {
        try {
            const buyers = (await schema.findDocs('account'))
                .filter(acc => acc.account_type === 'buyer');
            
            const buyerOptions = buyers.map(b => 
                `<option value="${b._id}">${b.account_name}</option>`
            ).join('');
            
            let lotInfo = '';
            let costPerMtr = 0;
            if (lotId) {
                const lot = await db.get(lotId);
                // Calculate cost
                const lotCosts = (await schema.findDocs('lot_cost'))
                    .filter(cost => cost.lot_id === lotId);
                
                const totalCost = lotCosts.reduce((sum, cost) => sum + cost.total_cost, 0);
                costPerMtr = totalCost / lot.current_qty;
                
                lotInfo = `
                    <div class="alert alert-info">
                        <strong>Selected Lot:</strong> ${lot.lot_number || lot._id.substr(-6)}<br>
                        <strong>Available:</strong> ${lot.current_qty} ${lot.uom}<br>
                        <strong>Cost/mtr:</strong> ₹${costPerMtr.toFixed(2)}
                    </div>
                    <input type="hidden" id="lotId" value="${lotId}">
                    <input type="hidden" id="costPerMtr" value="${costPerMtr}">
                `;
            }
            
            // Get packed lots for selection if no lotId provided
            let lotOptions = '';
            if (!lotId) {
                const packedLots = (await schema.findDocs('lot'))
                    .filter(lot => lot.current_stage === 'packing' && lot.status === 'active');
                lotOptions = packedLots.map(lot => 
                    `<option value="${lot._id}">${lot.lot_number || lot._id.substr(-6)} - ${lot.current_qty} ${lot.uom}</option>`
                ).join('');
            }
            
            const formHtml = `
                <form id="salesForm" onsubmit="return app.saveSale(event)">
                    ${lotInfo}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Invoice Number *</label>
                            <input type="text" class="form-control" id="invoiceNumber" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Buyer *</label>
                            <select class="form-select" id="buyerId" required>
                                <option value="">Select Buyer</option>
                                ${buyerOptions}
                            </select>
                        </div>
                    </div>
                    ${!lotId ? `
                    <div class="mb-3">
                        <label class="form-label">Select Lot *</label>
                        <select class="form-select" id="lotIdSelect" required>
                            <option value="">Select Lot</option>
                            ${lotOptions}
                        </select>
                    </div>
                    ` : ''}
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Sale Quantity *</label>
                            <input type="number" class="form-control" id="saleQty" step="0.01" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Sale Price/mtr *</label>
                            <input type="number" class="form-control" id="salePrice" step="0.01" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Profit/mtr</label>
                            <input type="text" class="form-control" id="profitPerMtr" readonly>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Article Name</label>
                        <input type="text" class="form-control" id="articleName">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2"></textarea>
                    </div>
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <strong>Total Sale Amount:</strong>
                                <span id="totalSaleAmount">₹0.00</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <strong>Total Cost:</strong>
                                <span id="totalCost">₹0.00</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <strong>Total Profit:</strong>
                                <span id="totalProfit">₹0.00</span>
                            </div>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Create Sale</button>
                </form>
            `;
            
            document.getElementById('modalTitle').textContent = 'New Sale';
            document.getElementById('modalBody').innerHTML = formHtml;
            
            // Setup calculations
            this.setupSalesCalculations();
            this.modal.show();
        } catch (error) {
            console.error('Error showing sales form:', error);
            this.showToast('Error loading form: ' + error.message, 'danger');
        }
    }

    setupSalesCalculations() {
        const calculateSale = () => {
            const qty = parseFloat(document.getElementById('saleQty')?.value) || 0;
            const price = parseFloat(document.getElementById('salePrice')?.value) || 0;
            const cost = parseFloat(document.getElementById('costPerMtr')?.value) || 0;
            
            const totalSale = qty * price;
            const totalCost = qty * cost;
            const totalProfit = totalSale - totalCost;
            const profitPerMtr = price - cost;
            
            if (document.getElementById('profitPerMtr')) {
                document.getElementById('profitPerMtr').value = '₹' + profitPerMtr.toFixed(2);
            }
            if (document.getElementById('totalSaleAmount')) {
                document.getElementById('totalSaleAmount').textContent = '₹' + totalSale.toFixed(2);
            }
            if (document.getElementById('totalCost')) {
                document.getElementById('totalCost').textContent = '₹' + totalCost.toFixed(2);
            }
            if (document.getElementById('totalProfit')) {
                document.getElementById('totalProfit').textContent = '₹' + totalProfit.toFixed(2);
            }
        };

        const modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.addEventListener('input', (e) => {
                if (e.target.id === 'saleQty' || e.target.id === 'salePrice') {
                    calculateSale();
                }
            });
        }
    }

    async useLotForSale(lotId) {
        await this.showSalesForm(lotId);
    }

    async saveSale(event) {
        event.preventDefault();
        
        try {
            const lotId = document.getElementById('lotId')?.value || 
                         document.getElementById('lotIdSelect')?.value;
            
            const saleData = {
                invoice_number: document.getElementById('invoiceNumber').value,
                buyer_account_id: document.getElementById('buyerId').value,
                sale_date: new Date().toISOString(),
                lot_id: lotId,
                sale_qty: parseFloat(document.getElementById('saleQty').value),
                sale_price: parseFloat(document.getElementById('salePrice').value),
                article_name: document.getElementById('articleName').value,
                remarks: document.getElementById('remarks').value,
                status: 'completed'
            };
            
            const lot = await db.get(lotId);
            
            // Check if sufficient stock
            if (saleData.sale_qty > lot.current_qty) {
                throw new Error('Insufficient stock in lot');
            }
            
            // Calculate costs
            const lotCosts = (await schema.findDocs('lot_cost'))
                .filter(cost => cost.lot_id === lotId);
            
            const totalCost = lotCosts.reduce((sum, cost) => sum + cost.total_cost, 0);
            const costPerMtr = totalCost / lot.current_qty;
            
            // Calculate sale totals
            const totalSaleAmount = saleData.sale_qty * saleData.sale_price;
            const totalCostAmount = saleData.sale_qty * costPerMtr;
            const totalProfit = totalSaleAmount - totalCostAmount;
            
            saleData.total_amount = totalSaleAmount;
            saleData.total_cost = totalCostAmount;
            saleData.total_profit = totalProfit;
            
            // Create sale
            const sale = await schema.createDoc('sale', saleData);
            
            // Update lot
            lot.current_stage = 'sale';
            lot.current_qty -= saleData.sale_qty;
            if (lot.current_qty <= 0) {
                lot.status = 'completed';
            }
            await schema.updateDoc(lot);
            
            // Create stock movement
            await schema.createDoc('stock_movement', {
                lot_id: lotId,
                from_stage: 'packing',
                to_stage: 'sale',
                qty: saleData.sale_qty,
                uom: lot.uom,
                rate: saleData.sale_price,
                total_cost: totalSaleAmount,
                reference_type: 'sale',
                reference_id: sale._id,
                movement_date: new Date().toISOString()
            });
            
            // Create sale item
            await schema.createDoc('sale_item', {
                sale_id: sale._id,
                lot_id: lotId,
                article_name: saleData.article_name,
                qty: saleData.sale_qty,
                sale_price: saleData.sale_price,
                final_cost: costPerMtr,
                profit: totalProfit
            });
            
            // Create accounting voucher for sale
            const voucher = await schema.createDoc('voucher', {
                voucher_type: 'sale',
                voucher_date: new Date().toISOString(),
                reference_no: saleData.invoice_number,
                narration: 'Sale of goods',
                created_by: 'system'
            });
            
            // Create voucher entries
            await schema.createDoc('voucher_entry', {
                voucher_id: voucher._id,
                account_id: saleData.buyer_account_id,
                debit: totalSaleAmount,
                credit: 0
            });
            
            await schema.createDoc('voucher_entry', {
                voucher_id: voucher._id,
                account_id: 'sales_account', // This should be configured
                debit: 0,
                credit: totalSaleAmount
            });
            
            this.modal.hide();
            await this.loadSalesData();
            this.showToast('Sale created successfully!', 'success');
        } catch (error) {
            console.error('Error saving sale:', error);
            this.showToast('Error: ' + error.message, 'danger');
        }
    }

    async viewSale(saleId) {
        this.showToast('View sale details: ' + saleId, 'info');
    }

    async printInvoice(saleId) {
        this.showToast('Print invoice: ' + saleId, 'info');
    }

    // ============= ACCOUNTS MODULE =============
    async showAccounts() {
        const content = `
            <div class="d-flex justify-content-between mb-4">
                <h4>Chart of Accounts</h4>
                <button class="btn btn-primary" onclick="app.showAccountForm()">
                    <i class="bi bi-plus-circle"></i> New Account
                </button>
            </div>
            
            <div class="row">
                <div class="col-md-3">
                    <div class="card">
                        <div class="card-header">
                            <h6>Account Types</h6>
                        </div>
                        <div class="list-group list-group-flush">
                            <a href="#" class="list-group-item list-group-item-action active" onclick="app.filterAccounts('all')">
                                All Accounts
                            </a>
                            <a href="#" class="list-group-item list-group-item-action" onclick="app.filterAccounts('buyer')">
                                Buyers
                            </a>
                            <a href="#" class="list-group-item list-group-item-action" onclick="app.filterAccounts('supplier')">
                                Suppliers
                            </a>
                            <a href="#" class="list-group-item list-group-item-action" onclick="app.filterAccounts('dying_party')">
                                Dying Parties
                            </a>
                            <a href="#" class="list-group-item list-group-item-action" onclick="app.filterAccounts('expense')">
                                Expenses
                            </a>
                        </div>
                    </div>
                </div>
                <div class="col-md-9">
                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Account Code</th>
                                            <th>Account Name</th>
                                            <th>Type</th>
                                            <th>Opening Balance</th>
                                            <th>Current Balance</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody id="accounts-table-body">
                                        Loading...
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.loadAccountsTable();
    }

    async loadAccountsTable(filter = 'all') {
        try {
            const accounts = await schema.findDocs('account');
            
            const filteredAccounts = filter === 'all' ? 
                accounts : accounts.filter(acc => acc.account_type === filter);
            
            // Calculate current balances (this would need to query vouchers)
            const html = filteredAccounts.map(account => `
                <tr>
                    <td><code>ACC-${account.account_code || account._id.substr(-6)}</code></td>
                    <td>${account.account_name}</td>
                    <td>
                        <span class="badge bg-secondary">
                            ${account.account_type}
                        </span>
                    </td>
                    <td>${account.opening_balance || 0}</td>
                    <td>${account.current_balance || 0}</td>
                    <td>
                        <span class="badge ${account.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                            ${account.status || 'active'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="app.viewAccount('${account._id}')">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning" onclick="app.editAccount('${account._id}')">
                            <i class="bi bi-pencil"></i>
                        </button>
                    </td>
                </tr>
            `).join('');
            
            document.getElementById('accounts-table-body').innerHTML = 
                html || '<tr><td colspan="7">No accounts found</td></tr>';
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    }

    async showAccountForm(accountId = null) {
        try {
            const accountTypes = [
                'asset', 'liability', 'income', 'expense', 
                'buyer', 'supplier', 'dying_party', 'packing_party'
            ];
            
            const typeOptions = accountTypes.map(type => 
                `<option value="${type}">${type.replace('_', ' ').toUpperCase()}</option>`
            ).join('');
            
            let accountData = {};
            if (accountId) {
                const account = await db.get(accountId);
                accountData = account;
            }
            
            // Get parent accounts
            const accounts = await schema.findDocs('account');
            const parentOptions = accounts.map(acc => 
                `<option value="${acc._id}" ${accountData.parent_account_id === acc._id ? 'selected' : ''}>
                    ${acc.account_name}
                </option>`
            ).join('');
            
            const formHtml = `
                <form id="accountForm" onsubmit="return app.saveAccount(event)">
                    ${accountId ? `<input type="hidden" id="accountId" value="${accountId}">` : ''}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Account Name *</label>
                            <input type="text" class="form-control" id="accountName" 
                                   value="${accountData.account_name || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Account Type *</label>
                            <select class="form-select" id="accountType" required>
                                <option value="">Select Type</option>
                                ${typeOptions}
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Account Code</label>
                            <input type="text" class="form-control" id="accountCode"
                                   value="${accountData.account_code || ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Parent Account</label>
                            <select class="form-select" id="parentAccountId">
                                <option value="">None</option>
                                ${parentOptions}
                            </select>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Opening Balance</label>
                            <input type="number" class="form-control" id="openingBalance" 
                                   value="${accountData.opening_balance || 0}" step="0.01">
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Balance Type</label>
                            <select class="form-select" id="openingType">
                                <option value="DR" ${accountData.opening_type === 'DR' ? 'selected' : ''}>Debit</option>
                                <option value="CR" ${accountData.opening_type === 'CR' ? 'selected' : ''}>Credit</option>
                            </select>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Level</label>
                            <input type="number" class="form-control" id="level" 
                                   value="${accountData.level || 1}" min="1" max="5">
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Contact Details</label>
                        <textarea class="form-control" id="contactDetails" rows="2">${accountData.contact_details || ''}</textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="status">
                            <option value="active" ${accountData.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${accountData.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                    <button type="submit" class="btn btn-primary">${accountId ? 'Update' : 'Save'} Account</button>
                </form>
            `;
            
            document.getElementById('modalTitle').textContent = 
                accountId ? 'Edit Account' : 'Create Account';
            document.getElementById('modalBody').innerHTML = formHtml;
            
            if (accountId && accountData.account_type) {
                document.getElementById('accountType').value = accountData.account_type;
            }
            
            this.modal.show();
        } catch (error) {
            console.error('Error showing account form:', error);
            this.showToast('Error loading form: ' + error.message, 'danger');
        }
    }

    async filterAccounts(filterType) {
        // Update active class in sidebar
        document.querySelectorAll('.list-group-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');
        
        await this.loadAccountsTable(filterType);
    }

    async saveAccount(event) {
        event.preventDefault();
        
        try {
            const accountId = document.getElementById('accountId')?.value;
            const accountData = {
                account_name: document.getElementById('accountName').value,
                account_type: document.getElementById('accountType').value,
                account_code: document.getElementById('accountCode').value,
                parent_account_id: document.getElementById('parentAccountId').value || null,
                opening_balance: parseFloat(document.getElementById('openingBalance').value) || 0,
                opening_type: document.getElementById('openingType').value,
                level: parseInt(document.getElementById('level').value) || 1,
                contact_details: document.getElementById('contactDetails').value,
                status: document.getElementById('status').value
            };
            
            if (accountId) {
                const existing = await db.get(accountId);
                await schema.updateDoc({ ...existing, ...accountData });
                this.showToast('Account updated successfully!', 'success');
            } else {
                await schema.createDoc('account', accountData);
                this.showToast('Account created successfully!', 'success');
            }
            
            this.modal.hide();
            await this.loadAccountsTable();
        } catch (error) {
            console.error('Error saving account:', error);
            this.showToast('Error saving account: ' + error.message, 'danger');
        }
    }

    async viewAccount(accountId) {
        this.showToast('View account details: ' + accountId, 'info');
    }

    async editAccount(accountId) {
        await this.showAccountForm(accountId);
    }

    // ============= VOUCHERS MODULE =============
    async showVouchers() {
        const content = `
            <div class="d-flex justify-content-between mb-4">
                <h4>Accounting Vouchers</h4>
                <div>
                    <button class="btn btn-outline-primary me-2" onclick="app.showVoucherForm('JV')">
                        <i class="bi bi-journal"></i> Journal Voucher
                    </button>
                    <button class="btn btn-outline-success" onclick="app.showVoucherForm('CP')">
                        <i class="bi bi-cash-coin"></i> Cash Payment
                    </button>
                </div>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Voucher #</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Reference</th>
                                    <th>Debit Total</th>
                                    <th>Credit Total</th>
                                    <th>Difference</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="vouchers-table-body">
                                Loading...
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.loadVouchersTable();
    }

    async loadVouchersTable() {
        try {
            const vouchers = await schema.findDocs('voucher');
            const voucherEntries = await schema.findDocs('voucher_entry');
            
            const html = vouchers.map(voucher => {
                const entries = voucherEntries.filter(entry => entry.voucher_id === voucher._id);
                const debitTotal = entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
                const creditTotal = entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
                const difference = debitTotal - creditTotal;
                
                return `
                    <tr>
                        <td>${voucher.voucher_number || voucher._id.substr(-6)}</td>
                        <td>
                            <span class="badge ${voucher.voucher_type === 'JV' ? 'bg-primary' : 'bg-success'}">
                                ${voucher.voucher_type}
                            </span>
                        </td>
                        <td>${new Date(voucher.voucher_date).toLocaleDateString()}</td>
                        <td>${voucher.reference_no || '-'}</td>
                        <td>₹${debitTotal.toFixed(2)}</td>
                        <td>₹${creditTotal.toFixed(2)}</td>
                        <td class="${Math.abs(difference) > 0.01 ? 'text-danger' : 'text-success'}">
                            ₹${difference.toFixed(2)}
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="app.viewVoucher('${voucher._id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${Math.abs(difference) > 0.01 ? `
                                <span class="badge bg-danger">Unbalanced</span>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('vouchers-table-body').innerHTML = 
                html || '<tr><td colspan="8">No vouchers found</td></tr>';
        } catch (error) {
            console.error('Error loading vouchers:', error);
        }
    }

    async showVoucherForm(type) {
        try {
            const accounts = await schema.findDocs('account');
            const accountOptions = accounts.map(acc => 
                `<option value="${acc._id}">${acc.account_name} (${acc.account_type})</option>`
            ).join('');
            
            const formHtml = `
                <form id="voucherForm" onsubmit="return app.saveVoucher(event, '${type}')">
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Voucher Number *</label>
                            <input type="text" class="form-control" id="voucherNumber" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Date *</label>
                            <input type="date" class="form-control" id="voucherDate" 
                                   value="${new Date().toISOString().split('T')[0]}" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Reference No</label>
                            <input type="text" class="form-control" id="referenceNo">
                        </div>
                    </div>
                    
                    <h6 class="mt-4 mb-3">Voucher Entries</h6>
                    <div id="voucherEntries">
                        <div class="voucher-entry row g-3 mb-3 border p-3 rounded">
                            <div class="col-md-5">
                                <label class="form-label">Account *</label>
                                <select class="form-select account-select" required>
                                    <option value="">Select Account</option>
                                    ${accountOptions}
                                </select>
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Debit</label>
                                <input type="number" class="form-control debit-input" step="0.01" value="0">
                            </div>
                            <div class="col-md-3">
                                <label class="form-label">Credit</label>
                                <input type="number" class="form-control credit-input" step="0.01" value="0">
                            </div>
                            <div class="col-md-1">
                                <button type="button" class="btn btn-sm btn-danger mt-4" 
                                        onclick="this.closest('.voucher-entry').remove(); app.calculateVoucherTotal();">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <button type="button" class="btn btn-sm btn-outline-secondary mb-3" onclick="app.addVoucherEntry()">
                        <i class="bi bi-plus"></i> Add Entry
                    </button>
                    
                    <div class="mb-3">
                        <label class="form-label">Narration</label>
                        <textarea class="form-control" id="narration" rows="2"></textarea>
                    </div>
                    
                    <div class="card mb-3">
                        <div class="card-body">
                            <div class="d-flex justify-content-between">
                                <strong>Total Debit:</strong>
                                <span id="totalDebit">₹0.00</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <strong>Total Credit:</strong>
                                <span id="totalCredit">₹0.00</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <strong>Difference:</strong>
                                <span id="voucherDifference" class="text-danger">₹0.00</span>
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">Save Voucher</button>
                </form>
            `;
            
            document.getElementById('modalTitle').textContent = 
                type === 'JV' ? 'Journal Voucher' : 'Cash Payment Voucher';
            document.getElementById('modalBody').innerHTML = formHtml;
            
            // Setup calculations
            this.setupVoucherCalculations();
            this.modal.show();
        } catch (error) {
            console.error('Error showing voucher form:', error);
            this.showToast('Error loading form: ' + error.message, 'danger');
        }
    }

    setupVoucherCalculations() {
        const calculateVoucherTotal = () => {
            let totalDebit = 0;
            let totalCredit = 0;
            
            document.querySelectorAll('.voucher-entry').forEach(entry => {
                const debit = parseFloat(entry.querySelector('.debit-input').value) || 0;
                const credit = parseFloat(entry.querySelector('.credit-input').value) || 0;
                totalDebit += debit;
                totalCredit += credit;
            });
            
            const totalDebitElem = document.getElementById('totalDebit');
            const totalCreditElem = document.getElementById('totalCredit');
            const diffElem = document.getElementById('voucherDifference');
            
            if (totalDebitElem) totalDebitElem.textContent = '₹' + totalDebit.toFixed(2);
            if (totalCreditElem) totalCreditElem.textContent = '₹' + totalCredit.toFixed(2);
            
            const difference = totalDebit - totalCredit;
            if (diffElem) {
                diffElem.textContent = '₹' + difference.toFixed(2);
                diffElem.className = Math.abs(difference) > 0.01 ? 'text-danger' : 'text-success';
            }
        };

        const modalBody = document.getElementById('modalBody');
        if (modalBody) {
            modalBody.addEventListener('input', (e) => {
                if (e.target.classList.contains('debit-input') || e.target.classList.contains('credit-input')) {
                    calculateVoucherTotal();
                }
            });
            
            // Expose function globally
            window.app.calculateVoucherTotal = calculateVoucherTotal;
        }
        
        // Initial calculation
        setTimeout(calculateVoucherTotal, 100);
    }

    addVoucherEntry() {
        const entriesDiv = document.getElementById('voucherEntries');
        if (entriesDiv && entriesDiv.children.length > 0) {
            const newEntry = entriesDiv.children[0].cloneNode(true);
            
            // Clear values
            newEntry.querySelector('.account-select').value = '';
            newEntry.querySelector('.debit-input').value = '0';
            newEntry.querySelector('.credit-input').value = '0';
            
            entriesDiv.appendChild(newEntry);
        }
    }

    async saveVoucher(event, type) {
        event.preventDefault();
        
        try {
            const voucherData = {
                voucher_type: type,
                voucher_number: document.getElementById('voucherNumber').value,
                voucher_date: document.getElementById('voucherDate').value,
                reference_no: document.getElementById('referenceNo').value,
                narration: document.getElementById('narration').value,
                status: 'draft'
            };
            
            // Check if balanced
            const totalDebit = parseFloat(document.getElementById('totalDebit').textContent.replace('₹', ''));
            const totalCredit = parseFloat(document.getElementById('totalCredit').textContent.replace('₹', ''));
            
            if (Math.abs(totalDebit - totalCredit) > 0.01) {
                this.showToast('Voucher must be balanced!', 'warning');
                return;
            }
            
            // Collect entries
            const entries = [];
            document.querySelectorAll('.voucher-entry').forEach(entry => {
                const accountId = entry.querySelector('.account-select').value;
                const debit = parseFloat(entry.querySelector('.debit-input').value) || 0;
                const credit = parseFloat(entry.querySelector('.credit-input').value) || 0;
                
                if (accountId && (debit > 0 || credit > 0)) {
                    entries.push({
                        account_id: accountId,
                        debit: debit,
                        credit: credit
                    });
                }
            });
            
            if (entries.length === 0) {
                this.showToast('Please add at least one entry', 'warning');
                return;
            }
            
            // Create voucher
            const voucher = await schema.createDoc('voucher', {
                ...voucherData,
                status: 'posted'
            });
            
            // Create entries
            for (const entry of entries) {
                await schema.createDoc('voucher_entry', {
                    ...entry,
                    voucher_id: voucher._id
                });
            }
            
            this.modal.hide();
            await this.loadVouchersTable();
            this.showToast('Voucher saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving voucher:', error);
            this.showToast('Error saving voucher: ' + error.message, 'danger');
        }
    }

    async viewVoucher(voucherId) {
        this.showToast('View voucher details: ' + voucherId, 'info');
    }

    // ============= REPORTS MODULE =============
    async showReports() {
        const content = `
            <div class="row mb-4">
                <div class="col-md-12">
                    <h4>Reports & Analytics</h4>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-3 mb-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5>Stock Summary</h5>
                            <button class="btn btn-outline-primary mt-2" onclick="app.generateStockReport()">
                                <i class="bi bi-file-earmark-bar-graph"></i> Generate
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5>Profit & Loss</h5>
                            <button class="btn btn-outline-success mt-2" onclick="app.generateProfitLossReport()">
                                <i class="bi bi-graph-up"></i> Generate
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5>Lot Tracking</h5>
                            <button class="btn btn-outline-info mt-2" onclick="app.generateLotTrackingReport()">
                                <i class="bi bi-diagram-3"></i> Generate
                            </button>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5>Account Ledger</h5>
                            <button class="btn btn-outline-warning mt-2" onclick="app.generateLedgerReport()">
                                <i class="bi bi-journal-text"></i> Generate
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5>Report Output</h5>
                        </div>
                        <div class="card-body">
                            <div id="reportOutput">
                                <p class="text-muted">Select a report to generate...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
    }

    async generateStockReport() {
        try {
            const lots = await schema.findDocs('lot');
            const products = await schema.findDocs('product');
            const productMap = {};
            products.forEach(p => productMap[p._id] = p);
            
            // Group by product and stage
            const summary = {};
            lots.forEach(lot => {
                if (lot.status === 'active') {
                    const product = productMap[lot.current_product_id];
                    const key = `${product?.product_name || 'Unknown'}_${lot.current_stage}`;
                    
                    if (!summary[key]) {
                        summary[key] = {
                            product: product?.product_name || 'Unknown',
                            stage: lot.current_stage,
                            totalQty: 0,
                            lots: 0
                        };
                    }
                    
                    summary[key].totalQty += lot.current_qty;
                    summary[key].lots += 1;
                }
            });
            
            const html = `
                <h5>Stock Summary Report</h5>
                <p>Generated: ${new Date().toLocaleString()}</p>
                
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Stage</th>
                            <th>Total Quantity</th>
                            <th>Number of Lots</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.values(summary).map(item => `
                            <tr>
                                <td>${item.product}</td>
                                <td><span class="lot-tag ${item.stage}-stage">${item.stage}</span></td>
                                <td>${item.totalQty.toFixed(2)}</td>
                                <td>${item.lots}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <button class="btn btn-primary" onclick="window.print()">
                    <i class="bi bi-printer"></i> Print Report
                </button>
            `;
            
            document.getElementById('reportOutput').innerHTML = html;
        } catch (error) {
            console.error('Error generating stock report:', error);
            this.showToast('Error generating report: ' + error.message, 'danger');
        }
    }

    async generateProfitLossReport() {
        try {
            const sales = await schema.findDocs('sale');
            const purchases = await schema.findDocs('purchase');
            const processOrders = await schema.findDocs('process_order');
            
            const totalSales = sales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
            const totalPurchaseCost = purchases.reduce((sum, purchase) => sum + (purchase.total_amount || 0), 0);
            const totalProcessCost = processOrders.reduce((sum, order) => sum + (order.total_cost || 0), 0);
            
            const totalCost = totalPurchaseCost + totalProcessCost;
            const totalProfit = totalSales - totalCost;
            const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
            
            const html = `
                <h5>Profit & Loss Statement</h5>
                <p>Period: All Time</p>
                <p>Generated: ${new Date().toLocaleString()}</p>
                
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr>
                                <th>Total Sales</th>
                                <td class="text-end">₹${totalSales.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <th>Total Purchase Cost</th>
                                <td class="text-end">₹${totalPurchaseCost.toLocaleString()}</td>
                            </tr>
                            <tr>
                                <th>Total Process Cost</th>
                                <td class="text-end">₹${totalProcessCost.toLocaleString()}</td>
                            </tr>
                            <tr class="table-secondary">
                                <th><strong>Total Cost</strong></th>
                                <td class="text-end"><strong>₹${totalCost.toLocaleString()}</strong></td>
                            </tr>
                            <tr class="${totalProfit >= 0 ? 'table-success' : 'table-danger'}">
                                <th><strong>Net Profit/Loss</strong></th>
                                <td class="text-end"><strong>₹${totalProfit.toLocaleString()}</strong></td>
                            </tr>
                            <tr>
                                <th>Profit Margin</th>
                                <td class="text-end">${profitMargin.toFixed(2)}%</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <canvas id="profitChart" width="400" height="200"></canvas>
                    </div>
                </div>
                
                <button class="btn btn-primary" onclick="window.print()">
                    <i class="bi bi-printer"></i> Print Report
                </button>
                
                <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
                <script>
                    const ctx = document.getElementById('profitChart').getContext('2d');
                    new Chart(ctx, {
                        type: 'doughnut',
                        data: {
                            labels: ['Sales', 'Costs', 'Profit'],
                            datasets: [{
                                data: [${totalSales}, ${totalCost}, ${totalProfit > 0 ? totalProfit : 0}],
                                backgroundColor: [
                                    '#3498db',
                                    '#e74c3c',
                                    '#2ecc71'
                                ]
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'bottom'
                                }
                            }
                        }
                    });
                </script>
            `;
            
            document.getElementById('reportOutput').innerHTML = html;
        } catch (error) {
            console.error('Error generating P&L report:', error);
            this.showToast('Error generating report: ' + error.message, 'danger');
        }
    }

    async generateLotTrackingReport() {
        try {
            const lots = await schema.findDocs('lot');
            const movements = await schema.findDocs('stock_movement');
            
            const html = `
                <h5>Lot Tracking Report</h5>
                <p>Generated: ${new Date().toLocaleString()}</p>
                
                ${lots.map(lot => {
                    const lotMovements = movements
                        .filter(m => m.lot_id === lot._id)
                        .sort((a, b) => new Date(a.movement_date) - new Date(b.movement_date));
                    
                    return `
                        <div class="card mb-3">
                            <div class="card-header">
                                <strong>Lot: ${lot.lot_number || lot._id.substr(-6)}</strong>
                                <span class="badge ${lot.status === 'active' ? 'bg-success' : 'bg-secondary'} ms-2">
                                    ${lot.status}
                                </span>
                            </div>
                            <div class="card-body">
                                <div class="row">
                                    <div class="col-md-4">
                                        <strong>Current Stage:</strong> 
                                        <span class="lot-tag ${lot.current_stage}-stage">${lot.current_stage}</span>
                                    </div>
                                    <div class="col-md-4">
                                        <strong>Current Qty:</strong> ${lot.current_qty} ${lot.uom}
                                    </div>
                                    <div class="col-md-4">
                                        <strong>Created:</strong> ${new Date(lot.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                                
                                <h6 class="mt-3">Movement History:</h6>
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Qty</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${lotMovements.map(movement => `
                                            <tr>
                                                <td>${new Date(movement.movement_date).toLocaleDateString()}</td>
                                                <td>${movement.from_stage}</td>
                                                <td>${movement.to_stage}</td>
                                                <td>${movement.qty} ${movement.uom}</td>
                                                <td>${movement.reference_type}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <button class="btn btn-primary" onclick="window.print()">
                    <i class="bi bi-printer"></i> Print Report
                </button>
            `;
            
            document.getElementById('reportOutput').innerHTML = html;
        } catch (error) {
            console.error('Error generating lot tracking report:', error);
            this.showToast('Error generating report: ' + error.message, 'danger');
        }
    }

    async generateLedgerReport() {
        try {
            const accounts = await schema.findDocs('account');
            const vouchers = await schema.findDocs('voucher');
            const voucherEntries = await schema.findDocs('voucher_entry');
            
            const html = `
                <h5>Account Ledger Report</h5>
                <p>Generated: ${new Date().toLocaleString()}</p>
                
                ${accounts.map(account => {
                    const entries = voucherEntries.filter(entry => entry.account_id === account._id);
                    const relatedVouchers = vouchers.filter(v => 
                        entries.some(e => e.voucher_id === v._id)
                    );
                    
                    let balance = account.opening_balance || 0;
                    let isDebit = account.opening_type === 'DR';
                    
                    const entryRows = entries.map(entry => {
                        const voucher = relatedVouchers.find(v => v._id === entry.voucher_id);
                        const debit = entry.debit || 0;
                        const credit = entry.credit || 0;
                        
                        if (debit > 0) {
                            balance += debit;
                            isDebit = true;
                        }
                        if (credit > 0) {
                            balance -= credit;
                            if (balance < 0) {
                                isDebit = false;
                                balance = Math.abs(balance);
                            }
                        }
                        
                        return `
                            <tr>
                                <td>${voucher ? new Date(voucher.voucher_date).toLocaleDateString() : ''}</td>
                                <td>${voucher?.voucher_number || ''}</td>
                                <td>${voucher?.narration || ''}</td>
                                <td class="text-end">${debit > 0 ? '₹' + debit.toFixed(2) : ''}</td>
                                <td class="text-end">${credit > 0 ? '₹' + credit.toFixed(2) : ''}</td>
                                <td class="text-end">₹${balance.toFixed(2)} ${isDebit ? 'DR' : 'CR'}</td>
                            </tr>
                        `;
                    }).join('');
                    
                    return `
                        <div class="card mb-3">
                            <div class="card-header">
                                <strong>${account.account_name}</strong>
                                <span class="badge bg-secondary ms-2">${account.account_type}</span>
                            </div>
                            <div class="card-body">
                                <p><strong>Opening Balance:</strong> ₹${account.opening_balance || 0} ${account.opening_type || 'DR'}</p>
                                
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Voucher #</th>
                                            <th>Narration</th>
                                            <th class="text-end">Debit</th>
                                            <th class="text-end">Credit</th>
                                            <th class="text-end">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${entryRows || '<tr><td colspan="6">No transactions</td></tr>'}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    `;
                }).join('')}
                
                <button class="btn btn-primary" onclick="window.print()">
                    <i class="bi bi-printer"></i> Print Report
                </button>
            `;
            
            document.getElementById('reportOutput').innerHTML = html;
        } catch (error) {
            console.error('Error generating ledger report:', error);
            this.showToast('Error generating report: ' + error.message, 'danger');
        }
    }

    // ============= SETTINGS MODULE =============
    async showSettings() {
        const content = `
            <div class="row">
                <div class="col-md-12">
                    <h4>System Settings</h4>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>Product Categories</h5>
                        </div>
                        <div class="card-body">
                            <form id="productForm" onsubmit="return app.saveProduct(event)">
                                <div class="mb-3">
                                    <label class="form-label">Product Name *</label>
                                    <input type="text" class="form-control" id="productName" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Category *</label>
                                    <select class="form-select" id="category" required>
                                        <option value="gray">Gray Cloth</option>
                                        <option value="dyed">Dyed Cloth</option>
                                        <option value="packed">Packed Goods</option>
                                        <option value="finished">Finished Goods</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Default UOM</label>
                                    <select class="form-select" id="uom">
                                        <option value="meter">Meter</option>
                                        <option value="thaan">Thaan</option>
                                        <option value="bag">Bag</option>
                                        <option value="kg">KG</option>
                                    </select>
                                </div>
                                <button type="submit" class="btn btn-primary">Add Product</button>
                            </form>
                            
                            <hr>
                            
                            <h6>Existing Products</h6>
                            <div id="productList">
                                Loading...
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5>User Management</h5>
                        </div>
                        <div class="card-body">
                            <div id="userList">
                                Loading users...
                            </div>
                        </div>
                    </div>
                    
                    <div class="card mt-4">
                        <div class="card-header">
                            <h5>System Information</h5>
                        </div>
                        <div class="card-body">
                            <div id="sysInfo">
                                Loading...
                            </div>
                            <button class="btn btn-sm btn-outline-danger mt-3" onclick="app.clearLocalData()">
                                <i class="bi bi-trash"></i> Clear Local Data
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.loadSettingsData();
    }

    async loadSettingsData() {
        try {
            // Load products
            const products = await schema.findDocs('product');
            const productHtml = `
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>UOM</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(p => `
                            <tr>
                                <td>${p.product_name}</td>
                                <td><span class="badge bg-secondary">${p.category}</span></td>
                                <td>${p.uom}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            document.getElementById('productList').innerHTML = productHtml || 'No products';
            
            // Load system info
            const info = await db.info();
            document.getElementById('sysInfo').innerHTML = `
                <p><strong>Database:</strong> ${info.db_name}</p>
                <p><strong>Document Count:</strong> ${info.doc_count}</p>
                <p><strong>Update Sequence:</strong> ${info.update_seq}</p>
                <p><strong>Sync Status:</strong> <span id="syncStatus">Checking...</span></p>
            `;
        } catch (error) {
            console.error('Error loading settings data:', error);
        }
    }

    async saveProduct(event) {
        event.preventDefault();
        
        try {
            const productData = {
                product_name: document.getElementById('productName').value,
                category: document.getElementById('category').value,
                uom: document.getElementById('uom').value
            };
            
            await schema.createDoc('product', productData);
            document.getElementById('productForm').reset();
            await this.loadSettingsData();
            this.showToast('Product added successfully!', 'success');
        } catch (error) {
            console.error('Error saving product:', error);
            this.showToast('Error: ' + error.message, 'danger');
        }
    }

    async clearLocalData() {
        if (confirm('Are you sure you want to clear all local data? This will delete everything except synced data.')) {
            try {
                await db.destroy();
                location.reload();
            } catch (error) {
                console.error('Error clearing data:', error);
                this.showToast('Error clearing data: ' + error.message, 'danger');
            }
        }
    }

    // ============= UTILITY METHODS =============
    showToast(message, type = 'info') {
        // Check if Toast is available
        if (typeof bootstrap === 'undefined' || !bootstrap.Toast) {
            console.log(`Toast [${type}]: ${message}`);
            return;
        }
        
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.appendChild(toast);
        document.body.appendChild(container);
        
        try {
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            
            toast.addEventListener('hidden.bs.toast', () => {
                container.remove();
            });
        } catch (error) {
            console.error('Error showing toast:', error);
            container.remove();
        }
    }

    updateSyncStatus() {
        const statusElem = document.getElementById('sync-status');
        if (statusElem) {
            // In a real app, you would check actual sync status
            statusElem.textContent = 'Online';
            statusElem.className = 'text-success';
        }
    }
}

// Initialize the application when DOM is loaded
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new TextileERPApp();
    
    // Make app globally available for onclick handlers
    window.app = app;
    
    // Set up global functions for onclick handlers
    window.showDashboard = () => app.showModule('dashboard');
    window.showModule = (module) => app.showModule(module);
    window.syncNow = () => {
        app.showToast('Sync started...', 'info');
        app.setupSync();
    };
});

// Make sure the methods are available globally for onclick handlers
window.showDashboard = () => window.app?.showModule('dashboard');
window.showModule = (module) => window.app?.showModule(module);
window.syncNow = () => {
    window.app?.showToast('Sync started...', 'info');
    window.app?.setupSync();
};