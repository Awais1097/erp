// Sales Module
const salesModule = {
    async load() {
        if (!authManager.hasPermission('sales')) {
            document.getElementById('content-area').innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="bi bi-shield-exclamation"></i> Access Denied</h4>
                    <p>You don't have permission to access the Sales module.</p>
                </div>
            `;
            return;
        }
        
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4><i class="bi bi-cash-coin"></i> Sales Management</h4>
                    <p class="text-muted">Manage sales orders, invoices, and track profits</p>
                </div>
                <div>
                    <button class="btn btn-primary" onclick="salesModule.showSaleForm()">
                        <i class="bi bi-plus-circle"></i> New Sale
                    </button>
                    <button class="btn btn-outline-secondary ms-2" onclick="salesModule.generateInvoiceReport()">
                        <i class="bi bi-printer"></i> Print Report
                    </button>
                </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Today's Sales</h6>
                            <h3 id="today-sales">Rs0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">This Month</h6>
                            <h3 id="month-sales">Rs0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Total Profit</h6>
                            <h3 id="total-profit">Rs0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Avg Margin</h6>
                            <h3 id="avg-margin">0%</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="filterStatus" onchange="salesModule.filterSales()">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Buyer</label>
                            <select class="form-select" id="filterBuyer" onchange="salesModule.filterSales()">
                                <option value="">All Buyers</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date From</label>
                            <input type="date" class="form-control" id="filterDateFrom" onchange="salesModule.filterSales()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date To</label>
                            <input type="date" class="form-control" id="filterDateTo" onchange="salesModule.filterSales()">
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
                                    <th>Invoice #</th>
                                    <th>Buyer</th>
                                    <th>Date</th>
                                    <th>Total Qty</th>
                                    <th>Amount</th>
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
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <span id="sales-count">0</span> sales found
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
        await this.loadSalesTable();
        await this.updateStats();
    },

    async initializeFilters() {
        try {
            const buyers = (await schema.findDocs('account')).filter(acc => 
                acc.account_type === 'buyer' || acc.account_name.includes('Buyer')
            );
            const buyerSelect = document.getElementById('filterBuyer');
            
            buyers.forEach(buyer => {
                const option = document.createElement('option');
                option.value = buyer._id;
                option.textContent = buyer.account_name;
                buyerSelect.appendChild(option);
            });
            
            // Set default dates (last 30 days)
            const today = new Date();
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            
            document.getElementById('filterDateFrom').value = lastMonth.toISOString().split('T')[0];
            document.getElementById('filterDateTo').value = today.toISOString().split('T')[0];
            
        } catch (error) {
            console.error('Error initializing filters:', error);
        }
    },

    async loadSalesTable(page = 1, itemsPerPage = 10) {
        try {
            const sales = await schema.findDocs('sale');
            const accounts = await schema.findDocs('account');
            
            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);
            
            // Apply filters
            let filtered = this.applyFilters(sales);
            
            // Calculate pagination
            const total = filtered.length;
            const totalPages = Math.ceil(total / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginated = filtered.slice(startIndex, endIndex);
            
            // Generate table rows
            const html = paginated.map(sale => {
                const buyer = accountMap[sale.buyer_account_id];
                
                // Calculate total profit
                const totalProfit = sale.sale_items?.reduce((sum, item) => 
                    sum + (item.profit || 0), 0) || 0;
                
                return `
                    <tr>
                        <td>
                            <div class="fw-bold">${sale.invoice_number}</div>
                            <small class="text-muted">${new Date(sale.sale_date).toLocaleDateString()}</small>
                        </td>
                        <td>
                            <div>${buyer?.account_name || 'N/A'}</div>
                            <small class="text-muted">${buyer?.contact_details || ''}</small>
                        </td>
                        <td>${new Date(sale.sale_date).toLocaleDateString()}</td>
                        <td>
                            <div>${sale.total_qty || 0} ${sale.uom || ''}</div>
                        </td>
                        <td>
                            <div class="fw-bold">Rs${sale.total_amount?.toFixed(2) || '0.00'}</div>
                        </td>
                        <td class="${totalProfit > 0 ? 'text-success' : 'text-danger'}">
                            Rs${totalProfit.toFixed(2)}
                        </td>
                        <td>
                            <span class="badge ${this.getStatusBadge(sale.status)}">
                                ${sale.status}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="salesModule.viewSale('${sale._id}')">
                                    <i class="bi bi-eye"></i>
                                </button>
                                <button class="btn btn-outline-success" onclick="salesModule.printInvoice('${sale._id}')">
                                    <i class="bi bi-printer"></i>
                                </button>
                                ${sale.status === 'pending' ? `
                                <button class="btn btn-outline-warning" onclick="salesModule.completeSale('${sale._id}')">
                                    <i class="bi bi-check-circle"></i>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('sales-table-body').innerHTML = 
                html || '<tr><td colspan="8" class="text-center">No sales found</td></tr>';
            
            document.getElementById('sales-count').textContent = total;
            this.generatePagination(page, totalPages);
            
        } catch (error) {
            console.error('Error loading sales:', error);
        }
    },

    applyFilters(sales) {
        const status = document.getElementById('filterStatus').value;
        const buyer = document.getElementById('filterBuyer').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        
        return sales.filter(sale => {
            if (status && sale.status !== status) return false;
            if (buyer && sale.buyer_account_id !== buyer) return false;
            
            if (dateFrom) {
                const saleDate = new Date(sale.sale_date);
                const fromDate = new Date(dateFrom);
                if (saleDate < fromDate) return false;
            }
            
            if (dateTo) {
                const saleDate = new Date(sale.sale_date);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (saleDate > toDate) return false;
            }
            
            return true;
        }).sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    },

    getStatusBadge(status) {
        const badges = {
            'pending': 'bg-warning',
            'completed': 'bg-success',
            'cancelled': 'bg-secondary',
            'paid': 'bg-primary',
            'unpaid': 'bg-danger'
        };
        return badges[status] || 'bg-light text-dark';
    },

    generatePagination(currentPage, totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" onclick="salesModule.loadSalesTable(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>`;
        pagination.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                const li = document.createElement('li');
                li.className = `page-item ${i === currentPage ? 'active' : ''}`;
                li.innerHTML = `<a class="page-link" href="#" onclick="salesModule.loadSalesTable(${i})">${i}</a>`;
                pagination.appendChild(li);
            }
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" onclick="salesModule.loadSalesTable(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>`;
        pagination.appendChild(nextLi);
    },

    async updateStats() {
        try {
            const sales = await schema.findDocs('sale');
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            const todaySales = sales.filter(s => 
                new Date(s.sale_date).toISOString().split('T')[0] === todayStr
            ).reduce((sum, s) => sum + (s.total_amount || 0), 0);
            
            const monthSales = sales.filter(s => {
                const saleDate = new Date(s.sale_date);
                return saleDate.getMonth() === today.getMonth() && 
                       saleDate.getFullYear() === today.getFullYear();
            }).reduce((sum, s) => sum + (s.total_amount || 0), 0);
            
            // Calculate profit
            let totalProfit = 0;
            let totalSaleAmount = 0;
            
            sales.forEach(sale => {
                if (sale.sale_items) {
                    sale.sale_items.forEach(item => {
                        totalProfit += item.profit || 0;
                        totalSaleAmount += item.sale_price || 0;
                    });
                }
            });
            
            const avgMargin = totalSaleAmount > 0 ? (totalProfit / totalSaleAmount) * 100 : 0;
            
            document.getElementById('today-sales').textContent = `Rs${todaySales.toFixed(2)}`;
            document.getElementById('month-sales').textContent = `Rs${monthSales.toFixed(2)}`;
            document.getElementById('total-profit').textContent = `Rs${totalProfit.toFixed(2)}`;
            document.getElementById('avg-margin').textContent = `${avgMargin.toFixed(1)}%`;
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    },

    filterSales() {
        this.loadSalesTable(1);
    },

    async showSaleForm() {
        try {
            // Get available lots in sale stage
            const lots = (await schema.findDocs('lot')).filter(lot => 
                lot.current_stage === 'sale' && lot.status === 'active'
            );
            
            // Get buyers
            const buyers = (await schema.findDocs('account')).filter(acc => 
                acc.account_type === 'buyer' || acc.account_name.includes('Buyer')
            );
            
            const lotOptions = lots.map(lot => {
                // Get product details
                return `
                    <option value="${lot._id}" data-qty="${lot.current_qty}" data-uom="${lot.uom}">
                        ${lot.lot_number} (${lot.current_qty} ${lot.uom})
                    </option>
                `;
            }).join('');
            
            const buyerOptions = buyers.map(buyer => 
                `<option value="${buyer._id}">${buyer.account_name}</option>`
            ).join('');
            
            const formHtml = `
                <form id="saleForm" onsubmit="return salesModule.saveSale(event)">
                    <div class="form-section">
                        <h6 class="section-title">Sale Details</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Invoice Number *</label>
                                <input type="text" class="form-control" id="invoiceNumber" 
                                       value="INV-${Date.now().toString().slice(-6)}" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Sale Date *</label>
                                <input type="date" class="form-control" id="saleDate" 
                                       value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Buyer *</label>
                                <select class="form-select" id="buyerAccountId" required>
                                    <option value="">Select Buyer</option>
                                    ${buyerOptions}
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Payment Terms</label>
                                <select class="form-select" id="paymentTerms">
                                    <option value="cash">Cash</option>
                                    <option value="7_days">7 Days</option>
                                    <option value="15_days">15 Days</option>
                                    <option value="30_days">30 Days</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h6 class="section-title">Sale Items</h6>
                        <div id="saleItemsContainer">
                            <div class="sale-item-row row mb-3">
                                <div class="col-md-4">
                                    <label class="form-label">Select Lot *</label>
                                    <select class="form-select lot-select" onchange="salesModule.updateLotDetails(this)">
                                        <option value="">Select Lot</option>
                                        ${lotOptions}
                                    </select>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Quantity</label>
                                    <input type="number" class="form-control qty-input" step="0.01" min="0" 
                                           placeholder="Qty" onchange="salesModule.calculateItemTotal(this)">
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">UOM</label>
                                    <input type="text" class="form-control uom-input" readonly>
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Sale Price/Unit</label>
                                    <input type="number" class="form-control price-input" step="0.01" min="0" 
                                           placeholder="Price" onchange="salesModule.calculateItemTotal(this)">
                                </div>
                                <div class="col-md-2">
                                    <label class="form-label">Total</label>
                                    <input type="number" class="form-control total-input" readonly>
                                    <button type="button" class="btn btn-sm btn-outline-danger mt-1" 
                                            onclick="this.closest('.sale-item-row').remove(); salesModule.calculateTotals()">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="salesModule.addSaleItem()">
                            <i class="bi bi-plus"></i> Add Another Item
                        </button>
                    </div>
                    
                    <div class="form-section">
                        <h6 class="section-title">Totals</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <table class="table table-sm">
                                    <tr>
                                        <td>Total Quantity:</td>
                                        <td id="totalQtyDisplay">0</td>
                                    </tr>
                                    <tr>
                                        <td>Total Sale Amount:</td>
                                        <td id="totalSaleAmount">Rs0.00</td>
                                    </tr>
                                    <tr>
                                        <td>Total Cost:</td>
                                        <td id="totalCostAmount">Rs0.00</td>
                                    </tr>
                                    <tr class="table-success">
                                        <td><strong>Total Profit:</strong></td>
                                        <td id="totalProfitAmount">Rs0.00</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2"></textarea>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-save"></i> Create Sale
                        </button>
                    </div>
                </form>
            `;
            
            app.showModal('New Sale', formHtml);
            
        } catch (error) {
            console.error('Error showing sale form:', error);
            app.showToast('Error loading form: ' + error.message, 'danger');
        }
    },

    addSaleItem() {
        const container = document.getElementById('saleItemsContainer');
        const newRow = container.children[0].cloneNode(true);
        
        // Clear inputs
        newRow.querySelector('.lot-select').value = '';
        newRow.querySelector('.qty-input').value = '';
        newRow.querySelector('.uom-input').value = '';
        newRow.querySelector('.price-input').value = '';
        newRow.querySelector('.total-input').value = '';
        
        container.appendChild(newRow);
    },

    async updateLotDetails(select) {
        const row = select.closest('.sale-item-row');
        const selectedOption = select.selectedOptions[0];
        const lotId = select.value;
        
        if (lotId) {
            const maxQty = selectedOption.dataset.qty;
            const uom = selectedOption.dataset.uom;
            
            row.querySelector('.qty-input').max = maxQty;
            row.querySelector('.uom-input').value = uom;
            
            // Get lot cost
            try {
                const lot = await schema.getDoc(lotId);
                const lotCosts = await schema.findDocs('lot_cost');
                const costs = lotCosts.filter(c => c.lot_id === lotId);
                
                const totalCost = costs.reduce((sum, cost) => sum + cost.total_cost, 0);
                const costPerUnit = totalCost / lot.current_qty;
                
                // Store cost for calculation
                row.dataset.costPerUnit = costPerUnit;
                
            } catch (error) {
                console.error('Error loading lot costs:', error);
            }
        }
    },

    calculateItemTotal(input) {
        const row = input.closest('.sale-item-row');
        const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
        const price = parseFloat(row.querySelector('.price-input').value) || 0;
        const total = qty * price;
        
        row.querySelector('.total-input').value = total.toFixed(2);
        this.calculateTotals();
    },

    calculateTotals() {
        const rows = document.querySelectorAll('.sale-item-row');
        let totalQty = 0;
        let totalSale = 0;
        let totalCost = 0;
        
        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
            const price = parseFloat(row.querySelector('.price-input').value) || 0;
            const costPerUnit = parseFloat(row.dataset.costPerUnit) || 0;
            
            totalQty += qty;
            totalSale += qty * price;
            totalCost += qty * costPerUnit;
        });
        
        const totalProfit = totalSale - totalCost;
        
        document.getElementById('totalQtyDisplay').textContent = totalQty.toFixed(2);
        document.getElementById('totalSaleAmount').textContent = `Rs${totalSale.toFixed(2)}`;
        document.getElementById('totalCostAmount').textContent = `Rs${totalCost.toFixed(2)}`;
        document.getElementById('totalProfitAmount').textContent = `Rs${totalProfit.toFixed(2)}`;
    },

    async saveSale(event) {
        event.preventDefault();
        
        try {
            const rows = document.querySelectorAll('.sale-item-row');
            const saleItems = [];
            let totalQty = 0;
            let totalAmount = 0;
            
            // Validate all rows
            for (const row of rows) {
                const lotSelect = row.querySelector('.lot-select');
                const qtyInput = row.querySelector('.qty-input');
                const priceInput = row.querySelector('.price-input');
                
                if (!lotSelect.value || !qtyInput.value || !priceInput.value) {
                    app.showToast('Please fill all fields for all items', 'danger');
                    return;
                }
                
                // Check quantity availability
                const lot = await schema.getDoc(lotSelect.value);
                const qty = parseFloat(qtyInput.value);
                
                if (qty > lot.current_qty) {
                    app.showToast(`Quantity exceeds available stock for lot ${lot.lot_number}`, 'danger');
                    return;
                }
                
                // Calculate item profit
                const lotCosts = await schema.findDocs('lot_cost');
                const costs = lotCosts.filter(c => c.lot_id === lotSelect.value);
                const totalCost = costs.reduce((sum, cost) => sum + cost.total_cost, 0);
                const costPerUnit = totalCost / lot.current_qty;
                const profit = (parseFloat(priceInput.value) - costPerUnit) * qty;
                
                saleItems.push({
                    lot_id: lotSelect.value,
                    article_name: lot.lot_number,
                    qty: qty,
                    uom: row.querySelector('.uom-input').value,
                    sale_price: parseFloat(priceInput.value),
                    final_cost: costPerUnit,
                    profit: profit
                });
                
                totalQty += qty;
                totalAmount += parseFloat(row.querySelector('.total-input').value);
            }
            
            if (saleItems.length === 0) {
                app.showToast('Please add at least one item', 'danger');
                return;
            }
            
            // Create sale record
            const saleData = {
                invoice_number: document.getElementById('invoiceNumber').value,
                buyer_account_id: document.getElementById('buyerAccountId').value,
                sale_date: document.getElementById('saleDate').value,
                total_qty: totalQty,
                uom: 'meter', // Default UOM
                total_amount: totalAmount,
                payment_terms: document.getElementById('paymentTerms').value,
                sale_items: saleItems,
                status: 'pending',
                remarks: document.getElementById('remarks').value,
                created_by: authManager.getCurrentUser().username
            };
            
            const sale = await schema.createDoc('sale', saleData);
            
            // Update lots and create stock movements
            for (const item of saleItems) {
                const lot = await schema.getDoc(item.lot_id);
                
                // Update lot
                lot.current_qty -= item.qty;
                if (lot.current_qty <= 0) {
                    lot.status = 'completed';
                }
                await schema.updateDoc(lot);
                
                // Create stock movement
                await schema.createDoc('stock_movement', {
                    lot_id: item.lot_id,
                    from_stage: 'sale',
                    to_stage: 'sold',
                    product_before: lot.current_product_id,
                    product_after: lot.current_product_id,
                    qty: item.qty,
                    uom: item.uom,
                    rate: item.sale_price,
                    total_cost: item.sale_price * item.qty,
                    reference_type: 'sale',
                    reference_id: sale._id,
                    movement_date: new Date().toISOString(),
                    remarks: 'Sold to buyer',
                    created_by: authManager.getCurrentUser().username
                });
            }
            
            app.showToast('Sale created successfully!', 'success');
            app.hideModal();
            await this.loadSalesTable();
            await this.updateStats();
            
        } catch (error) {
            console.error('Error saving sale:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async viewSale(saleId) {
        try {
            const sale = await schema.getDoc(saleId);
            const buyer = await schema.getDoc(sale.buyer_account_id);
            
            let itemsHtml = '';
            if (sale.sale_items) {
                itemsHtml = sale.sale_items.map((item, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${item.article_name}</td>
                        <td>${item.qty} ${item.uom}</td>
                        <td>Rs${item.sale_price?.toFixed(2) || '0.00'}</td>
                        <td>Rs${item.final_cost?.toFixed(2) || '0.00'}</td>
                        <td class="${item.profit > 0 ? 'text-success' : 'text-danger'}">
                            Rs${item.profit?.toFixed(2) || '0.00'}
                        </td>
                    </tr>
                `).join('');
            }
            
            const totalProfit = sale.sale_items?.reduce((sum, item) => sum + (item.profit || 0), 0) || 0;
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Invoice Number</th><td>${sale.invoice_number}</td></tr>
                            <tr><th>Buyer</th><td>${buyer?.account_name || 'N/A'}</td></tr>
                            <tr><th>Sale Date</th><td>${new Date(sale.sale_date).toLocaleDateString()}</td></tr>
                            <tr><th>Payment Terms</th><td>${sale.payment_terms || 'Cash'}</td></tr>
                            <tr><th>Status</th><td><span class="badge ${this.getStatusBadge(sale.status)}">${sale.status}</span></td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Total Quantity</th><td>${sale.total_qty || 0} ${sale.uom || ''}</td></tr>
                            <tr><th>Total Amount</th><td>Rs${sale.total_amount?.toFixed(2) || '0.00'}</td></tr>
                            <tr class="table-success"><th>Total Profit</th><td>Rs${totalProfit.toFixed(2)}</td></tr>
                            <tr><th>Created By</th><td>${sale.created_by || 'System'}</td></tr>
                            <tr><th>Created Date</th><td>${new Date(sale.created_at).toLocaleString()}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Sale Items</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Article</th>
                                    <th>Quantity</th>
                                    <th>Sale Price</th>
                                    <th>Cost</th>
                                    <th>Profit</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Remarks</h6>
                    <div class="alert alert-info">
                        ${sale.remarks || 'No remarks'}
                    </div>
                </div>
                
                ${sale.status === 'pending' ? `
                <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-success" onclick="salesModule.completeSale('${saleId}')">
                        <i class="bi bi-check-circle"></i> Complete Sale
                    </button>
                    <button class="btn btn-outline-primary" onclick="salesModule.printInvoice('${saleId}')">
                        <i class="bi bi-printer"></i> Print Invoice
                    </button>
                </div>
                ` : ''}
            `;
            
            app.showModal('Sale Details - ' + sale.invoice_number, content);
            
        } catch (error) {
            console.error('Error viewing sale:', error);
            app.showToast('Error loading details', 'danger');
        }
    },

    async completeSale(saleId) {
        try {
            const sale = await schema.getDoc(saleId);
            sale.status = 'completed';
            await schema.updateDoc(sale);
            
            app.showToast('Sale marked as completed!', 'success');
            await this.loadSalesTable();
            
        } catch (error) {
            console.error('Error completing sale:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    printInvoice(saleId) {
        // Implementation for printing invoice
        alert('Invoice printing feature would be implemented here');
    },

    async generateInvoiceReport() {
        try {
            const sales = await schema.findDocs('sale');
            
            // Create CSV report
            let csv = 'Invoice Number,Buyer,Date,Quantity,Amount,Profit,Status\n';
            
            sales.forEach(sale => {
                const totalProfit = sale.sale_items?.reduce((sum, item) => sum + (item.profit || 0), 0) || 0;
                const row = [
                    sale.invoice_number,
                    sale.buyer_account_id,
                    new Date(sale.sale_date).toLocaleDateString(),
                    sale.total_qty,
                    sale.total_amount,
                    totalProfit,
                    sale.status
                ];
                csv += row.map(field => `"${field}"`).join(',') + '\n';
            });
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            app.showToast('Sales report generated successfully', 'success');
            
        } catch (error) {
            console.error('Error generating report:', error);
            app.showToast('Error generating report', 'danger');
        }
    }
};

// Export the module
window.salesModule = salesModule;