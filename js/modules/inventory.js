// Inventory Module
const inventoryModule = {
    async load() {
        const user = authManager.getCurrentUser();
        const canEdit = user.role === 'admin' || user.role === 'manager';
        
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4><i class="bi bi-box-seam"></i> Lot-Based Inventory</h4>
                    <p class="text-muted">Track and manage all inventory lots across different stages</p>
                </div>
                <div>
                    ${canEdit ? `
                    <button class="btn btn-primary me-2" onclick="inventoryModule.showLotForm()">
                        <i class="bi bi-plus-circle"></i> New Lot
                    </button>
                    ` : ''}
                    <button class="btn btn-outline-secondary" onclick="inventoryModule.exportInventory()">
                        <i class="bi bi-download"></i> Export
                    </button>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Stage</label>
                            <select class="form-select" id="filterStage" onchange="inventoryModule.filterLots()">
                                <option value="">All Stages</option>
                                <option value="gray">Gray</option>
                                <option value="dying">Dying</option>
                                <option value="packing">Packing</option>
                                <option value="sale">Sale</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="filterStatus" onchange="inventoryModule.filterLots()">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="completed">Completed</option>
                                <option value="hold">Hold</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Product</label>
                            <select class="form-select" id="filterProduct" onchange="inventoryModule.filterLots()">
                                <option value="">All Products</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Search</label>
                            <div class="input-group">
                                <input type="text" class="form-control" id="searchLot" 
                                       placeholder="Lot number..." onkeyup="inventoryModule.filterLots()">
                                <button class="btn btn-outline-secondary" onclick="inventoryModule.clearFilters()">
                                    <i class="bi bi-x-circle"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Gray</h6>
                            <h3 id="gray-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Dying</h6>
                            <h3 id="dying-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Packing</h6>
                            <h3 id="packing-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Sale</h6>
                            <h3 id="sale-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Total Qty</h6>
                            <h3 id="total-qty">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Active</h6>
                            <h3 id="active-count">0</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Table -->
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
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="lots-table-body">
                                Loading...
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <span id="lot-count">0</span> lots found
                        </div>
                        <nav>
                            <ul class="pagination" id="pagination">
                                <!-- Pagination will be generated here -->
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.initializeFilters();
        await this.loadLotsTable();
        await this.updateSummary();
    },

    async initializeFilters() {
        try {
            const products = await schema.findDocs('product');
            const productSelect = document.getElementById('filterProduct');
            
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product._id;
                option.textContent = product.product_name;
                productSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Error initializing filters:', error);
        }
    },

    async loadLotsTable(page = 1, itemsPerPage = 10) {
        try {
            const lots = await schema.findDocs('lot');
            const products = await schema.findDocs('product');
            
            // Create product map
            const productMap = {};
            products.forEach(p => productMap[p._id] = p);
            
            // Apply filters
            let filteredLots = this.applyFilters(lots);
            
            // Update summary with filtered lots
            this.updateFilteredSummary(filteredLots);
            
            // Calculate pagination
            const totalLots = filteredLots.length;
            const totalPages = Math.ceil(totalLots / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedLots = filteredLots.slice(startIndex, endIndex);
            
            // Generate table rows
            const html = paginatedLots.map(lot => {
                const product = productMap[lot.current_product_id];
                const createdAt = new Date(lot.created_at);
                const daysOld = Math.floor((new Date() - createdAt) / (1000 * 60 * 60 * 24));
                
                return `
                    <tr>
                        <td>
                            <div class="fw-bold">${lot.lot_number || lot._id.substr(-6)}</div>
                            <small class="text-muted">ID: ${lot._id.substr(-6)}</small>
                        </td>
                        <td>
                            <div>${product?.product_name || 'N/A'}</div>
                            <small class="text-muted">${product?.category || ''}</small>
                        </td>
                        <td>
                            <span class="lot-tag ${lot.current_stage}-stage">${lot.current_stage}</span>
                            ${daysOld > 30 ? '<span class="badge bg-warning ms-1">Old</span>' : ''}
                        </td>
                        <td>
                            <div class="fw-bold">${lot.current_qty}</div>
                            ${lot.initial_qty ? `<small class="text-muted">Initial: ${lot.initial_qty}</small>` : ''}
                        </td>
                        <td>${lot.uom}</td>
                        <td>
                            <span class="badge ${lot.status === 'active' ? 'bg-success' : 
                                               lot.status === 'completed' ? 'bg-secondary' : 
                                               lot.status === 'hold' ? 'bg-warning' : 'bg-light text-dark'}">
                                ${lot.status}
                            </span>
                        </td>
                        <td>
                            <div>${createdAt.toLocaleDateString()}</div>
                            <small class="text-muted">${daysOld} days ago</small>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="inventoryModule.viewLot('${lot._id}')">
                                    <i class="bi bi-eye"></i>
                                </button>
                                ${authManager.getCurrentUser().role === 'admin' || authManager.getCurrentUser().role === 'manager' ? `
                                <button class="btn btn-outline-warning" onclick="inventoryModule.editLot('${lot._id}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="inventoryModule.deleteLot('${lot._id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('lots-table-body').innerHTML = 
                html || '<tr><td colspan="8" class="text-center">No lots found</td></tr>';
            
            // Update count
            document.getElementById('lot-count').textContent = totalLots;
            
            // Generate pagination
            this.generatePagination(page, totalPages);
            
        } catch (error) {
            console.error('Error loading lots:', error);
            document.getElementById('lots-table-body').innerHTML = 
                '<tr><td colspan="8" class="text-center text-danger">Error loading data</td></tr>';
        }
    },

    applyFilters(lots) {
        const stage = document.getElementById('filterStage').value;
        const status = document.getElementById('filterStatus').value;
        const product = document.getElementById('filterProduct').value;
        const search = document.getElementById('searchLot').value.toLowerCase();
        
        return lots.filter(lot => {
            // Stage filter
            if (stage && lot.current_stage !== stage) return false;
            
            // Status filter
            if (status && lot.status !== status) return false;
            
            // Product filter
            if (product && lot.current_product_id !== product) return false;
            
            // Search filter
            if (search) {
                const lotNumber = (lot.lot_number || '').toLowerCase();
                const lotId = lot._id.toLowerCase();
                return lotNumber.includes(search) || lotId.includes(search);
            }
            
            return true;
        });
    },

    async updateSummary() {
        try {
            const lots = await schema.findDocs('lot');
            
            // Count by stage
            const grayCount = lots.filter(l => l.current_stage === 'gray' && l.status === 'active').length;
            const dyingCount = lots.filter(l => l.current_stage === 'dying' && l.status === 'active').length;
            const packingCount = lots.filter(l => l.current_stage === 'packing' && l.status === 'active').length;
            const saleCount = lots.filter(l => l.current_stage === 'sale' && l.status === 'active').length;
            
            // Total quantity
            const totalQty = lots.reduce((sum, lot) => sum + (lot.current_qty || 0), 0);
            const activeCount = lots.filter(l => l.status === 'active').length;
            
            // Update UI
            document.getElementById('gray-count').textContent = grayCount;
            document.getElementById('dying-count').textContent = dyingCount;
            document.getElementById('packing-count').textContent = packingCount;
            document.getElementById('sale-count').textContent = saleCount;
            document.getElementById('total-qty').textContent = totalQty.toFixed(2);
            document.getElementById('active-count').textContent = activeCount;
            
        } catch (error) {
            console.error('Error updating summary:', error);
        }
    },

    updateFilteredSummary(filteredLots) {
        const grayCount = filteredLots.filter(l => l.current_stage === 'gray').length;
        const dyingCount = filteredLots.filter(l => l.current_stage === 'dying').length;
        const packingCount = filteredLots.filter(l => l.current_stage === 'packing').length;
        const saleCount = filteredLots.filter(l => l.current_stage === 'sale').length;
        
        // Update counts in summary cards
        document.querySelectorAll('#gray-count, #dying-count, #packing-count, #sale-count').forEach(el => {
            const type = el.id.replace('-count', '');
            el.textContent = eval(`${type}Count`);
        });
    },

    generatePagination(currentPage, totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `
            <a class="page-link" href="#" onclick="inventoryModule.loadLotsTable(${currentPage - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        `;
        pagination.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                const li = document.createElement('li');
                li.className = `page-item ${i === currentPage ? 'active' : ''}`;
                li.innerHTML = `
                    <a class="page-link" href="#" onclick="inventoryModule.loadLotsTable(${i})">${i}</a>
                `;
                pagination.appendChild(li);
            } else if (i === currentPage - 3 || i === currentPage + 3) {
                // Ellipsis
                const li = document.createElement('li');
                li.className = 'page-item disabled';
                li.innerHTML = '<span class="page-link">...</span>';
                pagination.appendChild(li);
            }
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" onclick="inventoryModule.loadLotsTable(${currentPage + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        `;
        pagination.appendChild(nextLi);
    },

    filterLots() {
        this.loadLotsTable(1);
    },

    clearFilters() {
        document.getElementById('filterStage').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterProduct').value = '';
        document.getElementById('searchLot').value = '';
        this.loadLotsTable(1);
    },

    async showLotForm(lotId = null) {
        try {
            const products = await schema.findDocs('product');
            const productOptions = products.map(p => 
                `<option value="${p._id}">${p.product_name} (${p.category})</option>`
            ).join('');
            
            let lotData = {};
            if (lotId) {
                const lot = await schema.getDoc(lotId);
                lotData = lot;
            }
            
            const formHtml = `
                <form id="lotForm" onsubmit="return inventoryModule.saveLot(event)">
                    ${lotId ? `<input type="hidden" id="lotId" value="${lotId}">` : ''}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Lot Number *</label>
                            <input type="text" class="form-control" id="lotNumber" 
                                   value="${lotData.lot_number || ''}" required
                                   placeholder="Enter unique lot number">
                            <div class="form-text">Unique identifier for this lot</div>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Lot Type</label>
                            <select class="form-select" id="lotType">
                                <option value="production" ${lotData.lot_type === 'production' ? 'selected' : ''}>Production</option>
                                <option value="purchase" ${lotData.lot_type === 'purchase' ? 'selected' : ''}>Purchase</option>
                                <option value="transfer" ${lotData.lot_type === 'transfer' ? 'selected' : ''}>Transfer</option>
                            </select>
                        </div>
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
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Initial Quantity *</label>
                            <input type="number" class="form-control" id="initialQty" 
                                   value="${lotData.initial_qty || lotData.current_qty || 0}" step="0.01" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Current Quantity *</label>
                            <input type="number" class="form-control" id="currentQty" 
                                   value="${lotData.current_qty || 0}" step="0.01" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">UOM *</label>
                            <select class="form-select" id="uom" required>
                                <option value="meter" ${lotData.uom === 'meter' ? 'selected' : ''}>Meter</option>
                                <option value="thaan" ${lotData.uom === 'thaan' ? 'selected' : ''}>Thaan</option>
                                <option value="bag" ${lotData.uom === 'bag' ? 'selected' : ''}>Bag</option>
                                <option value="kg" ${lotData.uom === 'kg' ? 'selected' : ''}>KG</option>
                                <option value="piece" ${lotData.uom === 'piece' ? 'selected' : ''}>Piece</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Cost per Unit (Rs)</label>
                            <input type="number" class="form-control" id="costPerUnit" 
                                   value="${lotData.cost_per_unit || 0}" step="0.01">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Total Cost (Rs)</label>
                            <input type="number" class="form-control" id="totalCost" 
                                   value="${lotData.total_cost || 0}" step="0.01" readonly>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="status">
                            <option value="active" ${lotData.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="completed" ${lotData.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="hold" ${lotData.status === 'hold' ? 'selected' : ''}>On Hold</option>
                            <option value="cancelled" ${lotData.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2">${lotData.remarks || ''}</textarea>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary">${lotId ? 'Update' : 'Save'} Lot</button>
                        ${lotId ? `
                        <button type="button" class="btn btn-outline-secondary" onclick="inventoryModule.viewLot('${lotId}')">
                            View Details
                        </button>
                        ` : ''}
                    </div>
                </form>
                
                <script>
                    // Auto-calculate total cost
                    document.getElementById('currentQty').addEventListener('input', function() {
                        const qty = parseFloat(this.value) || 0;
                        const cost = parseFloat(document.getElementById('costPerUnit').value) || 0;
                        document.getElementById('totalCost').value = (qty * cost).toFixed(2);
                    });
                    
                    document.getElementById('costPerUnit').addEventListener('input', function() {
                        const qty = parseFloat(document.getElementById('currentQty').value) || 0;
                        const cost = parseFloat(this.value) || 0;
                        document.getElementById('totalCost').value = (qty * cost).toFixed(2);
                    });
                </script>
            `;
            
            app.showModal(lotId ? 'Edit Lot' : 'Create New Lot', formHtml);
            
            if (lotId && lotData.initial_product_id) {
                document.getElementById('initialProductId').value = lotData.initial_product_id;
            }
            
        } catch (error) {
            console.error('Error showing lot form:', error);
            app.showToast('Error loading form: ' + error.message, 'danger');
        }
    },

    async saveLot(event) {
        event.preventDefault();
        
        try {
            const lotId = document.getElementById('lotId')?.value;
            const lotData = {
                lot_number: document.getElementById('lotNumber').value,
                lot_type: document.getElementById('lotType').value,
                initial_product_id: document.getElementById('initialProductId').value,
                current_product_id: document.getElementById('initialProductId').value,
                initial_qty: parseFloat(document.getElementById('initialQty').value),
                current_qty: parseFloat(document.getElementById('currentQty').value),
                current_stage: document.getElementById('currentStage').value,
                uom: document.getElementById('uom').value,
                cost_per_unit: parseFloat(document.getElementById('costPerUnit').value) || 0,
                total_cost: parseFloat(document.getElementById('totalCost').value) || 0,
                status: document.getElementById('status').value,
                remarks: document.getElementById('remarks').value,
                updated_by: authManager.getCurrentUser().username
            };
            
            if (lotId) {
                const existing = await schema.getDoc(lotId);
                await schema.updateDoc({ ...existing, ...lotData });
                app.showToast('Lot updated successfully!', 'success');
            } else {
                await schema.createDoc('lot', lotData);
                app.showToast('Lot created successfully!', 'success');
            }
            
            app.hideModal();
            await this.loadLotsTable();
            await this.updateSummary();
            
        } catch (error) {
            console.error('Error saving lot:', error);
            app.showToast('Error saving lot: ' + error.message, 'danger');
        }
    },

    async viewLot(lotId) {
        try {
            const lot = await schema.getDoc(lotId);
            const product = await schema.getDoc(lot.current_product_id).catch(() => ({ 
                product_name: 'Unknown', 
                category: 'N/A' 
            }));
            
            // Get lot movements
            const movements = await schema.findDocs('stock_movement');
            const lotMovements = movements.filter(m => m.lot_id === lotId)
                .sort((a, b) => new Date(b.movement_date) - new Date(a.movement_date));
            
            // Get lot costs
            const lotCosts = await schema.findDocs('lot_cost');
            const costs = lotCosts.filter(c => c.lot_id === lotId);
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Lot Number</th><td>${lot.lot_number}</td></tr>
                            <tr><th>Product</th><td>${product.product_name} (${product.category})</td></tr>
                            <tr><th>Lot Type</th><td>${lot.lot_type || 'Standard'}</td></tr>
                            <tr><th>Current Stage</th>
                                <td><span class="lot-tag ${lot.current_stage}-stage">${lot.current_stage}</span></td>
                            </tr>
                            <tr><th>Quantity</th>
                                <td>
                                    <div>Current: <strong>${lot.current_qty} ${lot.uom}</strong></div>
                                    ${lot.initial_qty ? `<div>Initial: ${lot.initial_qty} ${lot.uom}</div>` : ''}
                                </td>
                            </tr>
                            <tr><th>Status</th>
                                <td>
                                    <span class="badge ${lot.status === 'active' ? 'bg-success' : 
                                                       lot.status === 'completed' ? 'bg-secondary' : 
                                                       'bg-warning'}">
                                        ${lot.status}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Cost per Unit</th><td>Rs${lot.cost_per_unit || '0.00'}</td></tr>
                            <tr><th>Total Cost</th><td>Rs${lot.total_cost || '0.00'}</td></tr>
                            <tr><th>Created</th><td>${new Date(lot.created_at).toLocaleString()}</td></tr>
                            <tr><th>Last Updated</th><td>${new Date(lot.updated_at).toLocaleString()}</td></tr>
                            <tr><th>Created By</th><td>${lot.created_by || 'System'}</td></tr>
                            <tr><th>Updated By</th><td>${lot.updated_by || 'System'}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-12">
                        <h5>Cost Breakdown</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Cost Type</th>
                                        <th>Cost per ${lot.uom}</th>
                                        <th>Total Cost</th>
                                        <th>Added On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${costs.map(cost => `
                                        <tr>
                                            <td>${cost.cost_type}</td>
                                            <td>Rs${cost.cost_per_mtr || cost.cost_per_unit || '0.00'}</td>
                                            <td>Rs${cost.total_cost || '0.00'}</td>
                                            <td>${new Date(cost.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    `).join('')}
                                    ${costs.length === 0 ? '<tr><td colspan="4" class="text-center">No cost data</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-12">
                        <h5>Movement History</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>From</th>
                                        <th>To</th>
                                        <th>Quantity</th>
                                        <th>Type</th>
                                        <th>Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${lotMovements.map(movement => `
                                        <tr>
                                            <td>${new Date(movement.movement_date).toLocaleString()}</td>
                                            <td>${movement.from_stage}</td>
                                            <td><span class="lot-tag ${movement.to_stage}-stage">${movement.to_stage}</span></td>
                                            <td>${movement.qty} ${movement.uom}</td>
                                            <td>${movement.reference_type}</td>
                                            <td>${movement.remarks || ''}</td>
                                        </tr>
                                    `).join('')}
                                    ${lotMovements.length === 0 ? '<tr><td colspan="6" class="text-center">No movements</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-12">
                        <div class="alert alert-info">
                            <h6>Remarks:</h6>
                            <p>${lot.remarks || 'No remarks'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-primary" onclick="inventoryModule.editLot('${lotId}')">
                        <i class="bi bi-pencil"></i> Edit Lot
                    </button>
                    <button class="btn btn-outline-primary" onclick="window.print()">
                        <i class="bi bi-printer"></i> Print Details
                    </button>
                </div>
            `;
            
            app.showModal('Lot Details - ' + lot.lot_number, content);
        } catch (error) {
            console.error('Error viewing lot:', error);
            app.showToast('Error loading lot details', 'danger');
        }
    },

    async editLot(lotId) {
        await this.showLotForm(lotId);
    },

    async deleteLot(lotId) {
        try {
            if (confirm('Are you sure you want to delete this lot? This action cannot be undone.')) {
                const lot = await schema.getDoc(lotId);
                lot.status = 'cancelled';
                await schema.updateDoc(lot);
                
                app.showToast('Lot marked as cancelled', 'success');
                await this.loadLotsTable();
                await this.updateSummary();
            }
        } catch (error) {
            console.error('Error deleting lot:', error);
            app.showToast('Error deleting lot: ' + error.message, 'danger');
        }
    },

    async exportInventory() {
        try {
            const lots = await schema.findDocs('lot');
            const products = await schema.findDocs('product');
            
            const productMap = {};
            products.forEach(p => productMap[p._id] = p);
            
            // Create CSV content
            let csv = 'Lot Number,Product,Stage,Quantity,UOM,Status,Created,Cost\n';
            
            lots.forEach(lot => {
                const product = productMap[lot.current_product_id];
                const row = [
                    lot.lot_number || '',
                    product?.product_name || '',
                    lot.current_stage,
                    lot.current_qty,
                    lot.uom,
                    lot.status,
                    new Date(lot.created_at).toLocaleDateString(),
                    lot.total_cost || 0
                ];
                csv += row.map(field => `"${field}"`).join(',') + '\n';
            });
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            app.showToast('Inventory exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting inventory:', error);
            app.showToast('Error exporting: ' + error.message, 'danger');
        }
    },

    async moveLotToStage(lotId, newStage) {
        try {
            const lot = await schema.getDoc(lotId);
            const oldStage = lot.current_stage;
            
            lot.current_stage = newStage;
            await schema.updateDoc(lot);
            
            // Create movement record
            await schema.createDoc('stock_movement', {
                lot_id: lotId,
                from_stage: oldStage,
                to_stage: newStage,
                qty: lot.current_qty,
                uom: lot.uom,
                reference_type: 'stage_change',
                movement_date: new Date().toISOString(),
                remarks: `Manually moved from ${oldStage} to ${newStage}`,
                created_by: authManager.getCurrentUser().username
            });
            
            app.showToast(`Lot moved to ${newStage} stage`, 'success');
            await this.loadLotsTable();
            
        } catch (error) {
            console.error('Error moving lot:', error);
            app.showToast('Error moving lot: ' + error.message, 'danger');
        }
    }
};

// Export the module
window.inventoryModule = inventoryModule;