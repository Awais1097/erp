// Purchase Module with Gray Reject
const purchaseModule = {
    async load() {
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4><i class="bi bi-cart-plus"></i> Gray Cloth Purchase</h4>
                    <p class="text-muted">Manage purchase orders and gray cloth rejections</p>
                </div>
                <div>
                    ${authManager.hasPermission('purchase') ? `
                    <button class="btn btn-primary me-2" onclick="purchaseModule.showPurchaseForm()">
                        <i class="bi bi-plus-circle"></i> New Purchase
                    </button>
                    <button class="btn btn-outline-danger" onclick="purchaseModule.showGrayRejectForm()">
                        <i class="bi bi-x-circle"></i> Gray Reject
                    </button>
                    ` : ''}
                </div>
            </div>
            
            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Total Purchases</h6>
                            <h3 id="total-purchases">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Pending</h6>
                            <h3 id="pending-purchases">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Total Qty</h6>
                            <h3 id="total-purchase-qty">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Rejected Qty</h6>
                            <h3 id="total-rejected-qty">0</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="row mb-4">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-exclamation-triangle text-warning"></i> Pending Actions</h6>
                        </div>
                        <div class="card-body">
                            <div id="pending-actions">Loading...</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h6>Recent Rejections</h6>
                        </div>
                        <div class="card-body">
                            <div id="recent-rejects">Loading...</div>
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
                            <select class="form-select" id="filterPurchaseStatus" onchange="purchaseModule.filterPurchases()">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="completed">Completed</option>
                                <option value="partial">Partial</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Supplier</label>
                            <select class="form-select" id="filterSupplier" onchange="purchaseModule.filterPurchases()">
                                <option value="">All Suppliers</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date From</label>
                            <input type="date" class="form-control" id="filterDateFrom" onchange="purchaseModule.filterPurchases()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date To</label>
                            <input type="date" class="form-control" id="filterDateTo" onchange="purchaseModule.filterPurchases()">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Table -->
            <div class="card">
                <div class="card-header">
                    <h5>Purchase Orders</h5>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Purchase #</th>
                                    <th>Supplier</th>
                                    <th>Date</th>
                                    <th>Total Qty</th>
                                    <th>Rejected Qty</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="purchase-table-body">
                                Loading...
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <span id="purchase-count">0</span> purchases found
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
        await this.loadPurchasesTable();
        await this.updateSummary();
        await this.loadPendingActions();
        await this.loadRecentRejects();
    },

    async initializeFilters() {
        try {
            const suppliers = (await schema.findDocs('account')).filter(acc => acc.account_type === 'supplier');
            const supplierSelect = document.getElementById('filterSupplier');
            
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier._id;
                option.textContent = supplier.account_name;
                supplierSelect.appendChild(option);
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

    async loadPurchasesTable(page = 1, itemsPerPage = 10) {
        try {
            const purchases = await schema.findDocs('purchase');
            const accounts = await schema.findDocs('account');
            const rejections = await schema.findDocs('gray_reject');
            
            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);
            
            // Apply filters
            let filteredPurchases = this.applyPurchaseFilters(purchases);
            
            // Calculate pagination
            const totalPurchases = filteredPurchases.length;
            const totalPages = Math.ceil(totalPurchases / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedPurchases = filteredPurchases.slice(startIndex, endIndex);
            
            // Generate table rows
            const html = paginatedPurchases.map(purchase => {
                const supplier = accountMap[purchase.supplier_account_id];
                const purchaseRejections = rejections.filter(r => r.purchase_id === purchase._id);
                const totalRejectedQty = purchaseRejections.reduce((sum, r) => sum + r.rejected_qty, 0);
                const hasRejections = totalRejectedQty > 0;
                
                return `
                    <tr>
                        <td>
                            <div class="fw-bold">PUR-${purchase.purchase_number || purchase._id.substr(-6)}</div>
                            <small class="text-muted">Ref: ${purchase.reference_no || '-'}</small>
                        </td>
                        <td>
                            <div>${supplier?.account_name || 'N/A'}</div>
                            <small class="text-muted">${supplier?.contact_details || ''}</small>
                        </td>
                        <td>
                            <div>${new Date(purchase.purchase_date).toLocaleDateString()}</div>
                            <small class="text-muted">${this.getDaysAgo(purchase.purchase_date)}</small>
                        </td>
                        <td>
                            <div class="fw-bold">${purchase.total_qty || 0}</div>
                            <small class="text-muted">${purchase.uom || ''}</small>
                        </td>
                        <td class="${hasRejections ? 'text-danger fw-bold' : ''}">
                            ${totalRejectedQty > 0 ? totalRejectedQty : '-'}
                        </td>
                        <td>
                            <div class="fw-bold">Rs${purchase.total_amount?.toFixed(2) || '0.00'}</div>
                        </td>
                        <td>
                            <span class="badge ${this.getPurchaseStatusBadge(purchase.status)}">
                                ${purchase.status || 'pending'}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="purchaseModule.viewPurchase('${purchase._id}')">
                                    <i class="bi bi-eye"></i>
                                </button>
                                ${authManager.hasPermission('purchase') ? `
                                <button class="btn btn-outline-warning" onclick="purchaseModule.editPurchase('${purchase._id}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="purchaseModule.showGrayRejectForm('${purchase._id}')">
                                    <i class="bi bi-x-circle"></i>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('purchase-table-body').innerHTML = 
                html || '<tr><td colspan="8" class="text-center">No purchases found</td></tr>';
            
            // Update count
            document.getElementById('purchase-count').textContent = totalPurchases;
            
            // Generate pagination
            this.generatePagination(page, totalPages);
            
        } catch (error) {
            console.error('Error loading purchases:', error);
            document.getElementById('purchase-table-body').innerHTML = 
                '<tr><td colspan="8" class="text-center text-danger">Error loading data</td></tr>';
        }
    },

    applyPurchaseFilters(purchases) {
        const status = document.getElementById('filterPurchaseStatus').value;
        const supplier = document.getElementById('filterSupplier').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        
        return purchases.filter(purchase => {
            // Status filter
            if (status && purchase.status !== status) return false;
            
            // Supplier filter
            if (supplier && purchase.supplier_account_id !== supplier) return false;
            
            // Date range filter
            if (dateFrom) {
                const purchaseDate = new Date(purchase.purchase_date);
                const fromDate = new Date(dateFrom);
                if (purchaseDate < fromDate) return false;
            }
            
            if (dateTo) {
                const purchaseDate = new Date(purchase.purchase_date);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (purchaseDate > toDate) return false;
            }
            
            return true;
        }).sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
    },

    getDaysAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    },

    getPurchaseStatusBadge(status) {
        const badges = {
            'pending': 'bg-warning',
            'completed': 'bg-success',
            'partial': 'bg-info',
            'rejected': 'bg-danger',
            'fully_rejected': 'bg-danger',
            'cancelled': 'bg-secondary'
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
        prevLi.innerHTML = `
            <a class="page-link" href="#" onclick="purchaseModule.loadPurchasesTable(${currentPage - 1})">
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
                    <a class="page-link" href="#" onclick="purchaseModule.loadPurchasesTable(${i})">${i}</a>
                `;
                pagination.appendChild(li);
            }
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" onclick="purchaseModule.loadPurchasesTable(${currentPage + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        `;
        pagination.appendChild(nextLi);
    },

    async updateSummary() {
        try {
            const purchases = await schema.findDocs('purchase');
            const rejections = await schema.findDocs('gray_reject');
            
            const totalPurchases = purchases.length;
            const pendingPurchases = purchases.filter(p => p.status === 'pending').length;
            const totalQty = purchases.reduce((sum, p) => sum + (p.total_qty || 0), 0);
            const totalRejected = rejections.reduce((sum, r) => sum + r.rejected_qty, 0);
            
            document.getElementById('total-purchases').textContent = totalPurchases;
            document.getElementById('pending-purchases').textContent = pendingPurchases;
            document.getElementById('total-purchase-qty').textContent = totalQty.toFixed(2);
            document.getElementById('total-rejected-qty').textContent = totalRejected.toFixed(2);
            
        } catch (error) {
            console.error('Error updating summary:', error);
        }
    },

    async loadPendingActions() {
        try {
            const purchases = await schema.findDocs('purchase');
            const pendingPurchases = purchases.filter(p => p.status === 'pending').slice(0, 5);
            
            const html = pendingPurchases.map(purchase => `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <small class="text-muted">PUR-${purchase.purchase_number}</small>
                        <div>${purchase.total_qty} ${purchase.uom}</div>
                    </div>
                    <button class="btn btn-sm btn-outline-primary" onclick="purchaseModule.viewPurchase('${purchase._id}')">
                        Process
                    </button>
                </div>
            `).join('');
            
            document.getElementById('pending-actions').innerHTML = 
                html || '<div class="text-muted text-center">No pending actions</div>';
                
        } catch (error) {
            console.error('Error loading pending actions:', error);
        }
    },

    async loadRecentRejects() {
        try {
            const rejections = await schema.findDocs('gray_reject');
            const recentRejects = rejections.slice(0, 5);
            
            const html = recentRejects.map(reject => `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <small class="text-muted">${reject.reject_number}</small>
                        <div class="text-danger">${reject.rejected_qty} ${reject.uom}</div>
                    </div>
                    <span class="badge ${reject.status === 'approved' ? 'bg-success' : 'bg-warning'}">
                        ${reject.status}
                    </span>
                </div>
            `).join('');
            
            document.getElementById('recent-rejects').innerHTML = 
                html || '<div class="text-muted text-center">No recent rejections</div>';
                
        } catch (error) {
            console.error('Error loading recent rejects:', error);
        }
    },

    filterPurchases() {
        this.loadPurchasesTable(1);
    },

    async showPurchaseForm(purchaseId = null) {
        try {
            const suppliers = (await schema.findDocs('account')).filter(acc => acc.account_type === 'supplier');
            const products = (await schema.findDocs('product')).filter(p => p.category === 'gray');
            
            let purchaseData = {};
            if (purchaseId) {
                purchaseData = await schema.getDoc(purchaseId);
            }
            
            const supplierOptions = suppliers.map(supplier => 
                `<option value="${supplier._id}" ${purchaseData.supplier_account_id === supplier._id ? 'selected' : ''}>
                    ${supplier.account_name}
                </option>`
            ).join('');
            
            const productOptions = products.map(product => 
                `<option value="${product._id}">${product.product_name} (${product.uom})</option>`
            ).join('');
            
            const formHtml = `
                <form id="purchaseForm" onsubmit="return purchaseModule.savePurchase(event)">
                    ${purchaseId ? `<input type="hidden" id="purchaseId" value="${purchaseId}">` : ''}
                    
                    <div class="form-section">
                        <h6 class="section-title">Purchase Details</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Purchase Number *</label>
                                <input type="text" class="form-control" id="purchaseNumber" 
                                       value="${purchaseData.purchase_number || `PUR-${Date.now().toString().slice(-6)}`}" 
                                       ${purchaseId ? 'readonly' : 'required'}>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Purchase Date *</label>
                                <input type="date" class="form-control" id="purchaseDate" 
                                       value="${purchaseData.purchase_date || new Date().toISOString().split('T')[0]}" required>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Supplier *</label>
                                <select class="form-select" id="supplierAccountId" required>
                                    <option value="">Select Supplier</option>
                                    ${supplierOptions}
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Reference No</label>
                                <input type="text" class="form-control" id="referenceNo" 
                                       value="${purchaseData.reference_no || ''}" 
                                       placeholder="Optional reference number">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h6 class="section-title">Purchase Items</h6>
                        <div id="purchaseItemsContainer">
                            ${purchaseData.purchase_items ? purchaseData.purchase_items.map((item, index) => `
                                <div class="purchase-item-row row mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Product *</label>
                                        <select class="form-select product-select" required>
                                            <option value="">Select Product</option>
                                            ${productOptions}
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">Quantity</label>
                                        <input type="number" class="form-control qty-input" step="0.01" min="0" 
                                               value="${item.qty || 0}" required onchange="purchaseModule.calculateItemTotal(this)">
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">UOM</label>
                                        <input type="text" class="form-control uom-input" 
                                               value="${item.uom || 'meter'}" readonly>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">Rate (Rs)</label>
                                        <input type="number" class="form-control rate-input" step="0.01" min="0" 
                                               value="${item.rate || 0}" required onchange="purchaseModule.calculateItemTotal(this)">
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">Total (Rs)</label>
                                        <input type="number" class="form-control total-input" 
                                               value="${item.total || 0}" readonly>
                                        <button type="button" class="btn btn-sm btn-outline-danger mt-1" 
                                                onclick="this.closest('.purchase-item-row').remove(); purchaseModule.calculatePurchaseTotals()">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="purchase-item-row row mb-3">
                                    <div class="col-md-4">
                                        <label class="form-label">Product *</label>
                                        <select class="form-select product-select" required onchange="purchaseModule.updateProductUOM(this)">
                                            <option value="">Select Product</option>
                                            ${productOptions}
                                        </select>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">Quantity</label>
                                        <input type="number" class="form-control qty-input" step="0.01" min="0" 
                                               required onchange="purchaseModule.calculateItemTotal(this)">
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">UOM</label>
                                        <input type="text" class="form-control uom-input" value="meter" readonly>
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">Rate (Rs)</label>
                                        <input type="number" class="form-control rate-input" step="0.01" min="0" 
                                               required onchange="purchaseModule.calculateItemTotal(this)">
                                    </div>
                                    <div class="col-md-2">
                                        <label class="form-label">Total (Rs)</label>
                                        <input type="number" class="form-control total-input" readonly>
                                        <button type="button" class="btn btn-sm btn-outline-danger mt-1" 
                                                onclick="this.closest('.purchase-item-row').remove(); purchaseModule.calculatePurchaseTotals()">
                                            <i class="bi bi-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `}
                        </div>
                        
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="purchaseModule.addPurchaseItem()">
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
                                        <td id="totalQtyDisplay">${purchaseData.total_qty || 0}</td>
                                    </tr>
                                    <tr>
                                        <td>Total Amount:</td>
                                        <td id="totalAmountDisplay">Rs${purchaseData.total_amount?.toFixed(2) || '0.00'}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2">${purchaseData.remarks || ''}</textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="status">
                            <option value="pending" ${purchaseData.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="completed" ${purchaseData.status === 'completed' ? 'selected' : ''}>Completed</option>
                            <option value="partial" ${purchaseData.status === 'partial' ? 'selected' : ''}>Partial</option>
                            <option value="cancelled" ${purchaseData.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary">
                            ${purchaseId ? 'Update' : 'Save'} Purchase
                        </button>
                    </div>
                </form>
            `;
            
            app.showModal(purchaseId ? 'Edit Purchase' : 'New Purchase', formHtml);
            
            // Set selected products if editing
            if (purchaseId && purchaseData.purchase_items) {
                purchaseData.purchase_items.forEach((item, index) => {
                    const row = document.querySelectorAll('.purchase-item-row')[index];
                    if (row) {
                        row.querySelector('.product-select').value = item.product_id;
                    }
                });
            }
            
            this.calculatePurchaseTotals();
            
        } catch (error) {
            console.error('Error showing purchase form:', error);
            app.showToast('Error loading form: ' + error.message, 'danger');
        }
    },

    addPurchaseItem() {
        const container = document.getElementById('purchaseItemsContainer');
        const newRow = container.children[0].cloneNode(true);
        
        // Clear inputs
        newRow.querySelector('.product-select').value = '';
        newRow.querySelector('.qty-input').value = '';
        newRow.querySelector('.rate-input').value = '';
        newRow.querySelector('.total-input').value = '';
        
        container.appendChild(newRow);
    },

    async updateProductUOM(select) {
        const row = select.closest('.purchase-item-row');
        const productId = select.value;
        
        if (productId) {
            try {
                const product = await schema.getDoc(productId);
                row.querySelector('.uom-input').value = product.uom || 'meter';
            } catch (error) {
                console.error('Error loading product:', error);
            }
        }
    },

    calculateItemTotal(input) {
        const row = input.closest('.purchase-item-row');
        const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
        const rate = parseFloat(row.querySelector('.rate-input').value) || 0;
        const total = qty * rate;
        
        row.querySelector('.total-input').value = total.toFixed(2);
        this.calculatePurchaseTotals();
    },

    calculatePurchaseTotals() {
        const rows = document.querySelectorAll('.purchase-item-row');
        let totalQty = 0;
        let totalAmount = 0;
        
        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.qty-input').value) || 0;
            const total = parseFloat(row.querySelector('.total-input').value) || 0;
            
            totalQty += qty;
            totalAmount += total;
        });
        
        document.getElementById('totalQtyDisplay').textContent = totalQty.toFixed(2);
        document.getElementById('totalAmountDisplay').textContent = `Rs${totalAmount.toFixed(2)}`;
    },

    async savePurchase(event) {
        event.preventDefault();
        
        try {
            const purchaseId = document.getElementById('purchaseId')?.value;
            const rows = document.querySelectorAll('.purchase-item-row');
            const purchaseItems = [];
            let totalQty = 0;
            let totalAmount = 0;
            
            // Validate all rows
            for (const row of rows) {
                const productSelect = row.querySelector('.product-select');
                const qtyInput = row.querySelector('.qty-input');
                const rateInput = row.querySelector('.rate-input');
                
                if (!productSelect.value || !qtyInput.value || !rateInput.value) {
                    app.showToast('Please fill all fields for all items', 'danger');
                    return;
                }
                
                const productId = productSelect.value;
                const qty = parseFloat(qtyInput.value);
                const rate = parseFloat(rateInput.value);
                const uom = row.querySelector('.uom-input').value;
                
                purchaseItems.push({
                    product_id: productId,
                    qty: qty,
                    uom: uom,
                    rate: rate,
                    total: qty * rate,
                    is_rejected: false
                });
                
                totalQty += qty;
                totalAmount += qty * rate;
            }
            
            if (purchaseItems.length === 0) {
                app.showToast('Please add at least one item', 'danger');
                return;
            }
            
            // Create purchase data
            const purchaseData = {
                purchase_number: document.getElementById('purchaseNumber').value,
                supplier_account_id: document.getElementById('supplierAccountId').value,
                purchase_date: document.getElementById('purchaseDate').value,
                reference_no: document.getElementById('referenceNo').value || null,
                purchase_items: purchaseItems,
                total_qty: totalQty,
                uom: 'meter', // Default UOM
                total_amount: totalAmount,
                status: document.getElementById('status').value,
                remarks: document.getElementById('remarks').value,
                updated_by: authManager.getCurrentUser().username
            };
            
            if (purchaseId) {
                // Update existing purchase
                const existing = await schema.getDoc(purchaseId);
                await schema.updateDoc({ ...existing, ...purchaseData });
                app.showToast('Purchase updated successfully!', 'success');
            } else {
                // Create new purchase
                await schema.createDoc('purchase', purchaseData);
                
                // Create lot for each purchase item
                for (const item of purchaseItems) {
                    const product = await schema.getDoc(item.product_id);
                    const lot = await schema.createDoc('lot', {
                        lot_number: `LOT-${Date.now().toString().slice(-6)}`,
                        lot_type: 'purchase',
                        initial_product_id: product._id,
                        current_product_id: product._id,
                        initial_qty: item.qty,
                        current_qty: item.qty,
                        current_stage: 'gray',
                        uom: item.uom,
                        cost_per_unit: item.rate,
                        total_cost: item.total,
                        status: 'active',
                        created_by: authManager.getCurrentUser().username,
                        remarks: `Purchased from purchase ${document.getElementById('purchaseNumber').value}`
                    });
                    
                    // Create lot cost for purchase
                    await schema.createDoc('lot_cost', {
                        lot_id: lot._id,
                        cost_type: 'purchase',
                        cost_per_mtr: item.rate,
                        total_cost: item.total,
                        created_by: authManager.getCurrentUser().username
                    });
                    
                    // Create stock movement
                    await schema.createDoc('stock_movement', {
                        lot_id: lot._id,
                        from_stage: 'purchase',
                        to_stage: 'gray',
                        product_before: product._id,
                        product_after: product._id,
                        qty: item.qty,
                        uom: item.uom,
                        rate: item.rate,
                        total_cost: item.total,
                        reference_type: 'purchase',
                        reference_id: purchaseId,
                        movement_date: new Date().toISOString(),
                        remarks: 'Gray cloth purchased from supplier',
                        created_by: authManager.getCurrentUser().username
                    });
                }
                
                app.showToast('Purchase created successfully!', 'success');
            }
            
            app.hideModal();
            await this.loadPurchasesTable();
            await this.updateSummary();
            
        } catch (error) {
            console.error('Error saving purchase:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async viewPurchase(purchaseId) {
        try {
            const purchase = await schema.getDoc(purchaseId);
            const supplier = await schema.getDoc(purchase.supplier_account_id);
            const products = await schema.findDocs('product');
            const rejections = await schema.findDocs('gray_reject');
            const purchaseRejections = rejections.filter(r => r.purchase_id === purchaseId);
            const totalRejectedQty = purchaseRejections.reduce((sum, r) => sum + r.rejected_qty, 0);
            
            const productMap = {};
            products.forEach(p => productMap[p._id] = p);
            
            let itemsHtml = '';
            if (purchase.purchase_items) {
                itemsHtml = purchase.purchase_items.map((item, index) => {
                    const product = productMap[item.product_id];
                    const itemRejections = purchaseRejections.filter(r => r.purchase_item_id === item._id);
                    const rejectedQty = itemRejections.reduce((sum, r) => sum + r.rejected_qty, 0);
                    const isRejected = rejectedQty > 0;
                    
                    return `
                        <tr class="${isRejected ? 'table-danger' : ''}">
                            <td>${index + 1}</td>
                            <td>${product?.product_name || 'N/A'}</td>
                            <td>${item.qty} ${item.uom}</td>
                            <td>Rs${item.rate?.toFixed(2) || '0.00'}</td>
                            <td>Rs${item.total?.toFixed(2) || '0.00'}</td>
                            <td class="${isRejected ? 'text-danger fw-bold' : ''}">
                                ${rejectedQty > 0 ? `${rejectedQty} ${item.uom}` : '-'}
                            </td>
                        </tr>
                    `;
                }).join('');
            }
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Purchase Number</th><td>${purchase.purchase_number}</td></tr>
                            <tr><th>Supplier</th><td>${supplier?.account_name || 'N/A'}</td></tr>
                            <tr><th>Purchase Date</th><td>${new Date(purchase.purchase_date).toLocaleDateString()}</td></tr>
                            <tr><th>Reference No</th><td>${purchase.reference_no || '-'}</td></tr>
                            <tr><th>Status</th><td><span class="badge ${this.getPurchaseStatusBadge(purchase.status)}">${purchase.status}</span></td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Total Quantity</th><td>${purchase.total_qty || 0} ${purchase.uom || ''}</td></tr>
                            <tr><th>Total Amount</th><td>Rs${purchase.total_amount?.toFixed(2) || '0.00'}</td></tr>
                            <tr><th>Rejected Quantity</th><td class="text-danger">${totalRejectedQty} ${purchase.uom || ''}</td></tr>
                            <tr><th>Accepted Quantity</th><td>${(purchase.total_qty || 0) - totalRejectedQty} ${purchase.uom || ''}</td></tr>
                            <tr><th>Created By</th><td>${purchase.created_by || 'System'}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Purchase Items</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Quantity</th>
                                    <th>Rate (Rs)</th>
                                    <th>Total (Rs)</th>
                                    <th>Rejected Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${itemsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Rejection History</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Reject #</th>
                                    <th>Date</th>
                                    <th>Quantity</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${purchaseRejections.map(reject => `
                                    <tr>
                                        <td>${reject.reject_number}</td>
                                        <td>${new Date(reject.reject_date).toLocaleDateString()}</td>
                                        <td class="text-danger">${reject.rejected_qty} ${reject.uom}</td>
                                        <td>${reject.reason || '-'}</td>
                                        <td><span class="badge ${reject.status === 'approved' ? 'bg-success' : 'bg-warning'}">${reject.status}</span></td>
                                    </tr>
                                `).join('')}
                                ${purchaseRejections.length === 0 ? '<tr><td colspan="5" class="text-center">No rejections</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Remarks</h6>
                    <div class="alert alert-info">
                        ${purchase.remarks || 'No remarks'}
                    </div>
                </div>
                
                <div class="d-grid gap-2 mt-3">
                    ${authManager.hasPermission('purchase') ? `
                    <button class="btn btn-outline-warning" onclick="purchaseModule.editPurchase('${purchaseId}')">
                        <i class="bi bi-pencil"></i> Edit Purchase
                    </button>
                    <button class="btn btn-outline-danger" onclick="purchaseModule.showGrayRejectForm('${purchaseId}')">
                        <i class="bi bi-x-circle"></i> Add Rejection
                    </button>
                    ` : ''}
                </div>
            `;
            
            app.showModal('Purchase Details - ' + purchase.purchase_number, content);
            
        } catch (error) {
            console.error('Error viewing purchase:', error);
            app.showToast('Error loading details', 'danger');
        }
    },

    async editPurchase(purchaseId) {
        await this.showPurchaseForm(purchaseId);
    },

    async showGrayRejectForm(purchaseId = null) {
        try {
            let purchaseData = {};
            let purchaseItems = [];
            
            if (purchaseId) {
                // Get purchase details
                purchaseData = await schema.getDoc(purchaseId);
                purchaseItems = purchaseData.purchase_items || [];
                
                // Get existing rejections
                const rejections = await schema.findDocs('gray_reject');
                const purchaseRejections = rejections.filter(r => r.purchase_id === purchaseId);
                
                // Calculate available quantity for each item
                purchaseItems.forEach(item => {
                    const itemRejections = purchaseRejections.filter(r => r.purchase_item_id === item._id);
                    const rejectedQty = itemRejections.reduce((sum, r) => sum + r.rejected_qty, 0);
                    item.available_qty = item.qty - rejectedQty;
                });
            } else {
                // Get all purchases with pending/completed status
                const purchases = await schema.findDocs('purchase');
                const filteredPurchases = purchases.filter(p => 
                    p.status === 'pending' || p.status === 'completed' || p.status === 'partial'
                );
                
                const purchaseOptions = filteredPurchases.map(p => 
                    `<option value="${p._id}">${p.purchase_number} - ${new Date(p.purchase_date).toLocaleDateString()}</option>`
                ).join('');
                
                const formHtml = `
                    <form id="grayRejectForm" onsubmit="return purchaseModule.saveGrayReject(event)">
                        <div class="mb-3">
                            <label class="form-label">Select Purchase *</label>
                            <select class="form-select" id="purchaseId" required onchange="purchaseModule.loadPurchaseItems(this.value)">
                                <option value="">Select Purchase</option>
                                ${purchaseOptions}
                            </select>
                        </div>
                        
                        <div id="purchaseItemsSection" style="display: none;">
                            <!-- Purchase items will be loaded here -->
                        </div>
                        
                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary" disabled id="submitBtn">
                                Create Rejection
                            </button>
                        </div>
                    </form>
                `;
                
                app.showModal('Gray Cloth Rejection', formHtml);
                return;
            }
            
            // If purchaseId is provided, show form with purchase items
            const products = await schema.findDocs('product');
            const productMap = {};
            products.forEach(p => productMap[p._id] = p);
            
            const itemsHtml = purchaseItems.map((item, index) => {
                const product = productMap[item.product_id];
                if (!product) return '';
                
                return `
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label class="form-label">${product.product_name}</label>
                            <div class="input-group">
                                <input type="number" class="form-control reject-qty-input" 
                                       data-item-id="${item._id}" 
                                       data-max-qty="${item.available_qty || item.qty}"
                                       placeholder="Reject quantity" 
                                       min="0" max="${item.available_qty || item.qty}" 
                                       step="0.01">
                                <span class="input-group-text">${item.uom}</span>
                            </div>
                            <div class="form-text">Available: ${item.available_qty || item.qty} ${item.uom}</div>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Reason</label>
                            <input type="text" class="form-control reject-reason-input" 
                                   data-item-id="${item._id}"
                                   placeholder="Reason for rejection">
                        </div>
                    </div>
                `;
            }).join('');
            
            const formHtml = `
                <form id="grayRejectForm" onsubmit="return purchaseModule.saveGrayReject(event)">
                    <input type="hidden" id="rejectPurchaseId" value="${purchaseId}">
                    
                    <div class="form-section">
                        <h6 class="section-title">Rejection Details</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Reject Number *</label>
                                <input type="text" class="form-control" id="rejectNumber" 
                                       value="REJ-${Date.now().toString().slice(-6)}" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Reject Date *</label>
                                <input type="date" class="form-control" id="rejectDate" 
                                       value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Purchase</label>
                            <input type="text" class="form-control" 
                                   value="${purchaseData.purchase_number}" readonly>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h6 class="section-title">Items to Reject</h6>
                        ${itemsHtml || '<div class="alert alert-info">No items available for rejection</div>'}
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Additional Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2" 
                                  placeholder="Additional remarks about the rejection..."></textarea>
                    </div>
                    
                    <div class="d-grid">
                        <button type="submit" class="btn btn-danger">
                            <i class="bi bi-x-circle"></i> Submit Rejection
                        </button>
                    </div>
                </form>
            `;
            
            app.showModal('Gray Cloth Rejection - ' + purchaseData.purchase_number, formHtml);
            
        } catch (error) {
            console.error('Error showing gray reject form:', error);
            app.showToast('Error loading form: ' + error.message, 'danger');
        }
    },

    async loadPurchaseItems(purchaseId) {
        try {
            const purchase = await schema.getDoc(purchaseId);
            const products = await schema.findDocs('product');
            const rejections = await schema.findDocs('gray_reject');
            const purchaseRejections = rejections.filter(r => r.purchase_id === purchaseId);
            
            const productMap = {};
            products.forEach(p => productMap[p._id] = p);
            
            let itemsHtml = '';
            if (purchase.purchase_items) {
                itemsHtml = purchase.purchase_items.map((item, index) => {
                    const product = productMap[item.product_id];
                    const itemRejections = purchaseRejections.filter(r => r.purchase_item_id === item._id);
                    const rejectedQty = itemRejections.reduce((sum, r) => sum + r.rejected_qty, 0);
                    const availableQty = item.qty - rejectedQty;
                    
                    if (availableQty <= 0) return '';
                    
                    return `
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label class="form-label">${product?.product_name || 'N/A'}</label>
                                <div class="input-group">
                                    <input type="number" class="form-control reject-qty-input" 
                                           data-item-id="${item._id}" 
                                           data-max-qty="${availableQty}"
                                           placeholder="Reject quantity" 
                                           min="0" max="${availableQty}" 
                                           step="0.01"
                                           onchange="purchaseModule.validateRejectQty(this)">
                                    <span class="input-group-text">${item.uom}</span>
                                </div>
                                <div class="form-text">Available: ${availableQty} ${item.uom}</div>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Reason</label>
                                <input type="text" class="form-control reject-reason-input" 
                                       data-item-id="${item._id}"
                                       placeholder="Reason for rejection">
                            </div>
                        </div>
                    `;
                }).join('');
            }
            
            const section = document.getElementById('purchaseItemsSection');
            section.innerHTML = itemsHtml || '<div class="alert alert-info">No items available for rejection</div>';
            section.style.display = itemsHtml ? 'block' : 'none';
            
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = !itemsHtml;
            
        } catch (error) {
            console.error('Error loading purchase items:', error);
        }
    },

    validateRejectQty(input) {
        const maxQty = parseFloat(input.dataset.maxQty) || 0;
        const currentQty = parseFloat(input.value) || 0;
        
        if (currentQty > maxQty) {
            input.value = maxQty;
            app.showToast(`Cannot reject more than ${maxQty}`, 'warning');
        }
        
        if (currentQty < 0) {
            input.value = 0;
        }
    },

    async saveGrayReject(event) {
        event.preventDefault();
        
        try {
            const purchaseId = document.getElementById('rejectPurchaseId')?.value || 
                               document.getElementById('purchaseId')?.value;
            
            if (!purchaseId) {
                app.showToast('Please select a purchase', 'danger');
                return;
            }
            
            const purchase = await schema.getDoc(purchaseId);
            const rejectItems = [];
            let totalRejectedQty = 0;
            
            // Collect rejection items
            const qtyInputs = document.querySelectorAll('.reject-qty-input');
            qtyInputs.forEach(input => {
                const qty = parseFloat(input.value) || 0;
                if (qty > 0) {
                    const itemId = input.dataset.itemId;
                    const reasonInput = document.querySelector(`.reject-reason-input[data-item-id="${itemId}"]`);
                    
                    rejectItems.push({
                        purchase_item_id: itemId,
                        rejected_qty: qty,
                        reason: reasonInput?.value || ''
                    });
                    
                    totalRejectedQty += qty;
                }
            });
            
            if (rejectItems.length === 0) {
                app.showToast('Please enter rejection quantity for at least one item', 'warning');
                return;
            }
            
            // Create rejection record
            const rejectData = {
                reject_number: document.getElementById('rejectNumber').value,
                purchase_id: purchaseId,
                reject_date: document.getElementById('rejectDate').value,
                rejected_qty: totalRejectedQty,
                uom: purchase.uom || 'meter',
                reject_items: rejectItems,
                remarks: document.getElementById('remarks')?.value || '',
                status: 'pending', // Needs approval
                created_by: authManager.getCurrentUser().username
            };
            
            const rejection = await schema.createDoc('gray_reject', rejectData);
            
            // Update purchase status if needed
            if (purchase.status === 'completed' || purchase.status === 'partial') {
                const totalPurchasedQty = purchase.total_qty || 0;
                const allRejections = await schema.findDocs('gray_reject');
                const purchaseRejections = allRejections.filter(r => r.purchase_id === purchaseId);
                const totalRejected = purchaseRejections.reduce((sum, r) => sum + r.rejected_qty, 0);
                
                if (totalRejected >= totalPurchasedQty) {
                    purchase.status = 'fully_rejected';
                } else if (totalRejected > 0) {
                    purchase.status = 'partial';
                }
                
                await schema.updateDoc(purchase);
            }
            
            app.showToast('Gray rejection created successfully!', 'success');
            app.hideModal();
            
            // Refresh data
            await this.loadPurchasesTable();
            await this.updateSummary();
            await this.loadRecentRejects();
            
        } catch (error) {
            console.error('Error saving gray rejection:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async viewRejection(rejectId) {
        try {
            const rejection = await schema.getDoc(rejectId);
            const purchase = await schema.getDoc(rejection.purchase_id);
            const supplier = await schema.getDoc(purchase.supplier_account_id);
            const products = await schema.findDocs('product');
            
            const productMap = {};
            products.forEach(p => productMap[p._id] = p);
            
            // Get purchase items
            const purchaseItems = purchase.purchase_items || [];
            const purchaseItemMap = {};
            purchaseItems.forEach(item => purchaseItemMap[item._id] = item);
            
            let itemsHtml = '';
            if (rejection.reject_items) {
                itemsHtml = rejection.reject_items.map((item, index) => {
                    const purchaseItem = purchaseItemMap[item.purchase_item_id];
                    const product = productMap[purchaseItem?.product_id];
                    
                    return `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${product?.product_name || 'N/A'}</td>
                            <td class="text-danger">${item.rejected_qty} ${purchaseItem?.uom || 'meter'}</td>
                            <td>${item.reason || '-'}</td>
                        </tr>
                    `;
                }).join('');
            }
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Reject Number</th><td>${rejection.reject_number}</td></tr>
                            <tr><th>Purchase</th><td>${purchase.purchase_number}</td></tr>
                            <tr><th>Supplier</th><td>${supplier?.account_name || 'N/A'}</td></tr>
                            <tr><th>Reject Date</th><td>${new Date(rejection.reject_date).toLocaleDateString()}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Total Rejected Qty</th><td class="text-danger">${rejection.rejected_qty} ${rejection.uom}</td></tr>
                            <tr><th>Status</th><td><span class="badge ${rejection.status === 'approved' ? 'bg-success' : 'bg-warning'}">${rejection.status}</span></td></tr>
                            <tr><th>Created By</th><td>${rejection.created_by || 'System'}</td></tr>
                            <tr><th>Created Date</th><td>${new Date(rejection.created_at).toLocaleString()}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Rejected Items</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Rejected Quantity</th>
                                    <th>Reason</th>
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
                        ${rejection.remarks || 'No remarks'}
                    </div>
                </div>
                
                ${rejection.status === 'pending' && authManager.hasPermission('purchase') ? `
                <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-success" onclick="purchaseModule.approveRejection('${rejectId}')">
                        <i class="bi bi-check-circle"></i> Approve Rejection
                    </button>
                    <button class="btn btn-danger" onclick="purchaseModule.rejectRejection('${rejectId}')">
                        <i class="bi bi-x-circle"></i> Reject Rejection
                    </button>
                </div>
                ` : ''}
            `;
            
            app.showModal('Rejection Details - ' + rejection.reject_number, content);
            
        } catch (error) {
            console.error('Error viewing rejection:', error);
            app.showToast('Error loading details', 'danger');
        }
    },

    async approveRejection(rejectId) {
        try {
            const rejection = await schema.getDoc(rejectId);
            
            if (confirm('Are you sure you want to approve this rejection?')) {
                rejection.status = 'approved';
                rejection.approved_by = authManager.getCurrentUser().username;
                rejection.approved_at = new Date().toISOString();
                
                await schema.updateDoc(rejection);
                
                // Update purchase items and create reverse stock movement
                const purchase = await schema.getDoc(rejection.purchase_id);
                const purchaseItems = purchase.purchase_items || [];
                const purchaseItemMap = {};
                purchaseItems.forEach(item => purchaseItemMap[item._id] = item);
                
                // Get products
                const products = await schema.findDocs('product');
                const productMap = {};
                products.forEach(p => productMap[p._id] = p);
                
                // Process each rejected item
                for (const item of rejection.reject_items || []) {
                    const purchaseItem = purchaseItemMap[item.purchase_item_id];
                    if (purchaseItem) {
                        // Update purchase item
                        purchaseItem.is_rejected = true;
                        
                        // Create reverse stock movement (return to supplier)
                        const product = productMap[purchaseItem.product_id];
                        await schema.createDoc('stock_movement', {
                            lot_id: null, // No specific lot for rejected items
                            from_stage: 'gray',
                            to_stage: 'rejected',
                            product_before: product._id,
                            product_after: product._id,
                            qty: item.rejected_qty,
                            uom: purchaseItem.uom,
                            rate: purchaseItem.rate,
                            total_cost: purchaseItem.rate * item.rejected_qty,
                            reference_type: 'rejection',
                            reference_id: rejectId,
                            movement_date: new Date().toISOString(),
                            remarks: `Gray cloth rejected: ${item.reason || 'No reason provided'}`,
                            created_by: authManager.getCurrentUser().username
                        });
                    }
                }
                
                // Update purchase with modified items
                await schema.updateDoc(purchase);
                
                app.showToast('Rejection approved successfully!', 'success');
                await this.loadPurchasesTable();
                await this.updateSummary();
            }
        } catch (error) {
            console.error('Error approving rejection:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async rejectRejection(rejectId) {
        try {
            const rejection = await schema.getDoc(rejectId);
            
            if (confirm('Are you sure you want to reject this rejection request?')) {
                rejection.status = 'rejected';
                rejection.rejected_by = authManager.getCurrentUser().username;
                rejection.rejected_at = new Date().toISOString();
                
                await schema.updateDoc(rejection);
                
                app.showToast('Rejection request rejected!', 'success');
                await this.loadPurchasesTable();
                await this.updateSummary();
            }
        } catch (error) {
            console.error('Error rejecting rejection:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    }
};

// Export the module
window.purchaseModule = purchaseModule;