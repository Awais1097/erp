// Vouchers Module (Double-Entry Accounting)
const vouchersModule = {
    async load() {
        if (!authManager.hasPermission('vouchers')) {
            document.getElementById('content-area').innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="bi bi-shield-exclamation"></i> Access Denied</h4>
                    <p>You don't have permission to access the Vouchers module.</p>
                </div>
            `;
            return;
        }
        
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4><i class="bi bi-receipt"></i> Voucher Management</h4>
                    <p class="text-muted">Double-entry accounting system with all voucher types</p>
                </div>
                <div>
                    <button class="btn btn-primary me-2" onclick="vouchersModule.showVoucherForm('JV')">
                        <i class="bi bi-plus-circle"></i> Journal Voucher
                    </button>
                    <div class="btn-group">
                        <button class="btn btn-outline-primary dropdown-toggle" type="button" 
                                data-bs-toggle="dropdown">
                            Other Vouchers
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="#" onclick="vouchersModule.showVoucherForm('BP')">
                                <i class="bi bi-cash-coin"></i> Bank Payment
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="vouchersModule.showVoucherForm('BR')">
                                <i class="bi bi-bank"></i> Bank Receipt
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="vouchersModule.showVoucherForm('CP')">
                                <i class="bi bi-cash"></i> Cash Payment
                            </a></li>
                            <li><a class="dropdown-item" href="#" onclick="vouchersModule.showVoucherForm('CR')">
                                <i class="bi bi-cash-stack"></i> Cash Receipt
                            </a></li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <!-- Summary Cards -->
            <div class="row mb-4">
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Total Vouchers</h6>
                            <h3 id="total-vouchers">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Journal Vouchers</h6>
                            <h3 id="jv-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Bank Payments</h6>
                            <h3 id="bp-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Cash Receipts</h6>
                            <h3 id="cr-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Today's Total</h6>
                            <h3 id="today-total">Rs0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">This Month</h6>
                            <h3 id="month-total">Rs0</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Voucher Type</label>
                            <select class="form-select" id="filterType" onchange="vouchersModule.filterVouchers()">
                                <option value="">All Types</option>
                                <option value="JV">Journal Voucher</option>
                                <option value="BP">Bank Payment</option>
                                <option value="BR">Bank Receipt</option>
                                <option value="CP">Cash Payment</option>
                                <option value="CR">Cash Receipt</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date From</label>
                            <input type="date" class="form-control" id="filterDateFrom" onchange="vouchersModule.filterVouchers()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date To</label>
                            <input type="date" class="form-control" id="filterDateTo" onchange="vouchersModule.filterVouchers()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Search</label>
                            <input type="text" class="form-control" id="searchVoucher" 
                                   placeholder="Voucher number..." onkeyup="vouchersModule.filterVouchers()">
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
                                    <th>Voucher #</th>
                                    <th>Type</th>
                                    <th>Date</th>
                                    <th>Narration</th>
                                    <th>Total Amount</th>
                                    <th>Created By</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="vouchers-table-body">
                                Loading...
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <span id="voucher-count">0</span> vouchers found
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
        await this.loadVouchersTable();
        await this.updateSummary();
    },

    async initializeFilters() {
        // Set default dates (last 30 days)
        const today = new Date();
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        
        document.getElementById('filterDateFrom').value = lastMonth.toISOString().split('T')[0];
        document.getElementById('filterDateTo').value = today.toISOString().split('T')[0];
    },

    async loadVouchersTable(page = 1, itemsPerPage = 10) {
        try {
            const vouchers = await schema.findDocs('voucher');
            
            // Apply filters
            let filtered = this.applyFilters(vouchers);
            
            // Calculate pagination
            const total = filtered.length;
            const totalPages = Math.ceil(total / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginated = filtered.slice(startIndex, endIndex);
            
            // Generate table rows
            const html = paginated.map(voucher => {
                return `
                    <tr>
                        <td>
                            <div class="fw-bold">${voucher.voucher_number}</div>
                            <small class="text-muted">Ref: ${voucher.reference_no || '-'}</small>
                        </td>
                        <td>
                            <span class="badge ${this.getVoucherTypeBadge(voucher.voucher_type)}">
                                ${voucher.voucher_type}
                            </span>
                        </td>
                        <td>
                            <div>${new Date(voucher.voucher_date).toLocaleDateString()}</div>
                            <small class="text-muted">${new Date(voucher.voucher_date).toLocaleTimeString()}</small>
                        </td>
                        <td>
                            <div>${voucher.narration || 'No narration'}</div>
                        </td>
                        <td>
                            <div class="fw-bold">Rs${voucher.total_amount?.toFixed(2) || '0.00'}</div>
                        </td>
                        <td>
                            <div>${voucher.created_by || 'System'}</div>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="vouchersModule.viewVoucher('${voucher._id}')">
                                    <i class="bi bi-eye"></i>
                                </button>
                                ${authManager.getCurrentUser().role === 'admin' ? `
                                <button class="btn btn-outline-danger" onclick="vouchersModule.deleteVoucher('${voucher._id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('vouchers-table-body').innerHTML = 
                html || '<tr><td colspan="7" class="text-center">No vouchers found</td></tr>';
            
            document.getElementById('voucher-count').textContent = total;
            this.generatePagination(page, totalPages);
            
        } catch (error) {
            console.error('Error loading vouchers:', error);
        }
    },

    applyFilters(vouchers) {
        const type = document.getElementById('filterType').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        const search = document.getElementById('searchVoucher').value.toLowerCase();
        
        return vouchers.filter(voucher => {
            if (type && voucher.voucher_type !== type) return false;
            
            if (dateFrom) {
                const voucherDate = new Date(voucher.voucher_date);
                const fromDate = new Date(dateFrom);
                if (voucherDate < fromDate) return false;
            }
            
            if (dateTo) {
                const voucherDate = new Date(voucher.voucher_date);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (voucherDate > toDate) return false;
            }
            
            if (search) {
                const number = voucher.voucher_number.toLowerCase();
                const reference = voucher.reference_no?.toLowerCase() || '';
                const narration = voucher.narration?.toLowerCase() || '';
                return number.includes(search) || reference.includes(search) || narration.includes(search);
            }
            
            return true;
        }).sort((a, b) => new Date(b.voucher_date) - new Date(a.voucher_date));
    },

    getVoucherTypeBadge(type) {
        const badges = {
            'JV': 'bg-primary',
            'BP': 'bg-danger',
            'BR': 'bg-success',
            'CP': 'bg-warning',
            'CR': 'bg-info'
        };
        return badges[type] || 'bg-secondary';
    },

    generatePagination(currentPage, totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" onclick="vouchersModule.loadVouchersTable(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>`;
        pagination.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                const li = document.createElement('li');
                li.className = `page-item ${i === currentPage ? 'active' : ''}`;
                li.innerHTML = `<a class="page-link" href="#" onclick="vouchersModule.loadVouchersTable(${i})">${i}</a>`;
                pagination.appendChild(li);
            }
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" onclick="vouchersModule.loadVouchersTable(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>`;
        pagination.appendChild(nextLi);
    },

    async updateSummary() {
        try {
            const vouchers = await schema.findDocs('voucher');
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            
            const total = vouchers.length;
            const jvCount = vouchers.filter(v => v.voucher_type === 'JV').length;
            const bpCount = vouchers.filter(v => v.voucher_type === 'BP').length;
            const crCount = vouchers.filter(v => v.voucher_type === 'CR').length;
            
            const todayTotal = vouchers.filter(v => 
                new Date(v.voucher_date).toISOString().split('T')[0] === todayStr
            ).reduce((sum, v) => sum + (v.total_amount || 0), 0);
            
            const monthTotal = vouchers.filter(v => {
                const voucherDate = new Date(v.voucher_date);
                return voucherDate.getMonth() === today.getMonth() && 
                       voucherDate.getFullYear() === today.getFullYear();
            }).reduce((sum, v) => sum + (v.total_amount || 0), 0);
            
            document.getElementById('total-vouchers').textContent = total;
            document.getElementById('jv-count').textContent = jvCount;
            document.getElementById('bp-count').textContent = bpCount;
            document.getElementById('cr-count').textContent = crCount;
            document.getElementById('today-total').textContent = `Rs${todayTotal.toFixed(2)}`;
            document.getElementById('month-total').textContent = `Rs${monthTotal.toFixed(2)}`;
            
        } catch (error) {
            console.error('Error updating summary:', error);
        }
    },

    filterVouchers() {
        this.loadVouchersTable(1);
    },

    async showVoucherForm(voucherType) {
        try {
            const accounts = await schema.findDocs('account');
            const lots = await schema.findDocs('lot');
            
            const accountOptions = accounts
                .filter(a => a.status === 'active')
                .map(a => `<option value="${a._id}">${a.account_name} (${a.account_type})</option>`)
                .join('');
            
            const lotOptions = lots
                .filter(l => l.status === 'active')
                .map(l => `<option value="${l._id}">${l.lot_number} (${l.current_stage})</option>`)
                .join('');
            
            const voucherInfo = {
                'JV': { name: 'Journal Voucher', description: 'General double-entry voucher' },
                'BP': { name: 'Bank Payment', description: 'Payment through bank' },
                'BR': { name: 'Bank Receipt', description: 'Receipt through bank' },
                'CP': { name: 'Cash Payment', description: 'Payment in cash' },
                'CR': { name: 'Cash Receipt', description: 'Receipt in cash' }
            };
            
            const info = voucherInfo[voucherType] || voucherInfo['JV'];
            
            const formHtml = `
                <form id="voucherForm" onsubmit="return vouchersModule.saveVoucher(event)">
                    <input type="hidden" id="voucherType" value="${voucherType}">
                    
                    <div class="form-section">
                        <h6 class="section-title">${info.name}</h6>
                        <p class="text-muted">${info.description}</p>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Voucher Number *</label>
                                <input type="text" class="form-control" id="voucherNumber" 
                                       value="${voucherType}-${Date.now().toString().slice(-6)}" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Voucher Date *</label>
                                <input type="date" class="form-control" id="voucherDate" 
                                       value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Reference Number</label>
                                <input type="text" class="form-control" id="referenceNo" 
                                       placeholder="Optional reference number">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Lot (Optional)</label>
                                <select class="form-select" id="lotId">
                                    <option value="">No Lot</option>
                                    ${lotOptions}
                                </select>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Narration *</label>
                            <textarea class="form-control" id="narration" rows="2" required 
                                      placeholder="Enter voucher narration..."></textarea>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h6 class="section-title">Voucher Entries</h6>
                        <p class="text-muted">Total Debit must equal Total Credit</p>
                        
                        <div id="voucherEntriesContainer">
                            <div class="voucher-entry-row row mb-3">
                                <div class="col-md-5">
                                    <label class="form-label">Account *</label>
                                    <select class="form-select account-select" required>
                                        <option value="">Select Account</option>
                                        ${accountOptions}
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Debit (Rs)</label>
                                    <input type="number" class="form-control debit-input" step="0.01" min="0" 
                                           placeholder="0.00" onchange="vouchersModule.calculateTotals()">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Credit (Rs)</label>
                                    <input type="number" class="form-control credit-input" step="0.01" min="0" 
                                           placeholder="0.00" onchange="vouchersModule.calculateTotals()">
                                </div>
                                <div class="col-md-1 d-flex align-items-end">
                                    <button type="button" class="btn btn-sm btn-outline-danger" 
                                            onclick="this.closest('.voucher-entry-row').remove(); vouchersModule.calculateTotals()">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <button type="button" class="btn btn-outline-primary btn-sm" onclick="vouchersModule.addVoucherEntry()">
                            <i class="bi bi-plus"></i> Add Entry
                        </button>
                    </div>
                    
                    <div class="form-section">
                        <h6 class="section-title">Totals</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <table class="table table-sm">
                                    <tr>
                                        <td>Total Debit:</td>
                                        <td id="totalDebitDisplay">Rs0.00</td>
                                    </tr>
                                    <tr>
                                        <td>Total Credit:</td>
                                        <td id="totalCreditDisplay">Rs0.00</td>
                                    </tr>
                                    <tr class="${voucherType === 'JV' ? 'table-warning' : 'table-info'}">
                                        <td><strong>Difference:</strong></td>
                                        <td id="totalDifference">Rs0.00</td>
                                    </tr>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-save"></i> Save Voucher
                        </button>
                    </div>
                </form>
                
                <script>
                    // Auto-format for cash/bank vouchers
                    const voucherType = '${voucherType}';
                    if (voucherType === 'BP' || voucherType === 'CP') {
                        // For payments, first entry is typically credit (payment made)
                        document.querySelector('.debit-input').placeholder = "Auto-calculated";
                        document.querySelector('.debit-input').readOnly = true;
                    } else if (voucherType === 'BR' || voucherType === 'CR') {
                        // For receipts, first entry is typically debit (receipt received)
                        document.querySelector('.credit-input').placeholder = "Auto-calculated";
                        document.querySelector('.credit-input').readOnly = true;
                    }
                </script>
            `;
            
            app.showModal('Create ' + info.name, formHtml);
            
        } catch (error) {
            console.error('Error showing voucher form:', error);
            app.showToast('Error loading form: ' + error.message, 'danger');
        }
    },

    addVoucherEntry() {
        const container = document.getElementById('voucherEntriesContainer');
        const newRow = container.children[0].cloneNode(true);
        
        // Clear inputs
        newRow.querySelector('.account-select').value = '';
        newRow.querySelector('.debit-input').value = '';
        newRow.querySelector('.credit-input').value = '';
        
        container.appendChild(newRow);
    },

    calculateTotals() {
        const rows = document.querySelectorAll('.voucher-entry-row');
        let totalDebit = 0;
        let totalCredit = 0;
        
        rows.forEach(row => {
            const debit = parseFloat(row.querySelector('.debit-input').value) || 0;
            const credit = parseFloat(row.querySelector('.credit-input').value) || 0;
            
            totalDebit += debit;
            totalCredit += credit;
        });
        
        const difference = totalDebit - totalCredit;
        
        document.getElementById('totalDebitDisplay').textContent = `Rs${totalDebit.toFixed(2)}`;
        document.getElementById('totalCreditDisplay').textContent = `Rs${totalCredit.toFixed(2)}`;
        document.getElementById('totalDifference').textContent = `Rs${difference.toFixed(2)}`;
        
        // Color code difference
        const diffElement = document.getElementById('totalDifference');
        if (Math.abs(difference) < 0.01) {
            diffElement.className = 'text-success';
        } else {
            diffElement.className = 'text-danger';
        }
    },

    async saveVoucher(event) {
        event.preventDefault();
        
        try {
            const voucherType = document.getElementById('voucherType').value;
            const rows = document.querySelectorAll('.voucher-entry-row');
            const voucherEntries = [];
            let totalDebit = 0;
            let totalCredit = 0;
            
            // Collect entries
            for (const row of rows) {
                const accountId = row.querySelector('.account-select').value;
                const debit = parseFloat(row.querySelector('.debit-input').value) || 0;
                const credit = parseFloat(row.querySelector('.credit-input').value) || 0;
                
                if (!accountId) {
                    app.showToast('Please select account for all entries', 'danger');
                    return;
                }
                
                if (debit === 0 && credit === 0) {
                    app.showToast('Please enter amount for all entries', 'danger');
                    return;
                }
                
                voucherEntries.push({
                    account_id: accountId,
                    debit: debit,
                    credit: credit,
                    lot_id: document.getElementById('lotId').value || null
                });
                
                totalDebit += debit;
                totalCredit += credit;
            }
            
            // Validate double-entry rules
            const difference = Math.abs(totalDebit - totalCredit);
            
            if (voucherType === 'JV' && difference > 0.01) {
                app.showToast('For Journal Voucher, total debit must equal total credit', 'danger');
                return;
            }
            
            if ((voucherType === 'BP' || voucherType === 'CP') && voucherEntries.length < 2) {
                app.showToast('Payment vouchers require at least 2 entries', 'danger');
                return;
            }
            
            if ((voucherType === 'BR' || voucherType === 'CR') && voucherEntries.length < 2) {
                app.showToast('Receipt vouchers require at least 2 entries', 'danger');
                return;
            }
            
            // Create voucher
            const voucherData = {
                voucher_type: voucherType,
                voucher_number: document.getElementById('voucherNumber').value,
                voucher_date: document.getElementById('voucherDate').value,
                reference_no: document.getElementById('referenceNo').value || null,
                narration: document.getElementById('narration').value,
                total_amount: Math.max(totalDebit, totalCredit),
                total_debit: totalDebit,
                total_credit: totalCredit,
                created_by: authManager.getCurrentUser().username
            };
            
            const voucher = await schema.createDoc('voucher', voucherData);
            
            // Create voucher entries
            for (const entry of voucherEntries) {
                await schema.createDoc('voucher_entry', {
                    ...entry,
                    voucher_id: voucher._id
                });
            }
            
            app.showToast(`${voucherType} created successfully!`, 'success');
            app.hideModal();
            await this.loadVouchersTable();
            await this.updateSummary();
            
        } catch (error) {
            console.error('Error saving voucher:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async viewVoucher(voucherId) {
        try {
            const voucher = await schema.getDoc(voucherId);
            const voucherEntries = (await schema.findDocs('voucher_entry'))
                .filter(entry => entry.voucher_id === voucherId);
            
            const accounts = await schema.findDocs('account');
            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);
            
            const entriesHtml = voucherEntries.map(entry => {
                const account = accountMap[entry.account_id];
                return `
                    <tr>
                        <td>${account?.account_name || 'N/A'}</td>
                        <td class="text-success">${entry.debit ? 'Rs' + entry.debit.toFixed(2) : '-'}</td>
                        <td class="text-danger">${entry.credit ? 'Rs' + entry.credit.toFixed(2) : '-'}</td>
                    </tr>
                `;
            }).join('');
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Voucher Number</th><td>${voucher.voucher_number}</td></tr>
                            <tr><th>Voucher Type</th><td><span class="badge ${this.getVoucherTypeBadge(voucher.voucher_type)}">${voucher.voucher_type}</span></td></tr>
                            <tr><th>Voucher Date</th><td>${new Date(voucher.voucher_date).toLocaleString()}</td></tr>
                            <tr><th>Reference Number</th><td>${voucher.reference_no || '-'}</td></tr>
                            <tr><th>Created By</th><td>${voucher.created_by || 'System'}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Total Amount</th><td>Rs${voucher.total_amount?.toFixed(2) || '0.00'}</td></tr>
                            <tr><th>Total Debit</th><td class="text-success">Rs${voucher.total_debit?.toFixed(2) || '0.00'}</td></tr>
                            <tr><th>Total Credit</th><td class="text-danger">Rs${voucher.total_credit?.toFixed(2) || '0.00'}</td></tr>
                            <tr><th>Created Date</th><td>${new Date(voucher.created_at).toLocaleString()}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Narration</h6>
                    <div class="alert alert-info">
                        ${voucher.narration || 'No narration'}
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Voucher Entries</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Account</th>
                                    <th>Debit (Rs)</th>
                                    <th>Credit (Rs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${entriesHtml}
                            </tbody>
                            <tfoot>
                                <tr class="table-active">
                                    <th>Total</th>
                                    <th class="text-success">Rs${voucher.total_debit?.toFixed(2) || '0.00'}</th>
                                    <th class="text-danger">Rs${voucher.total_credit?.toFixed(2) || '0.00'}</th>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                
                <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-outline-primary" onclick="window.print()">
                        <i class="bi bi-printer"></i> Print Voucher
                    </button>
                </div>
            `;
            
            app.showModal('Voucher Details - ' + voucher.voucher_number, content);
            
        } catch (error) {
            console.error('Error viewing voucher:', error);
            app.showToast('Error loading details', 'danger');
        }
    },

    async deleteVoucher(voucherId) {
        try {
            if (confirm('Are you sure you want to delete this voucher? This action cannot be undone.')) {
                const voucher = await schema.getDoc(voucherId);
                
                // Delete associated entries first
                const voucherEntries = await schema.findDocs('voucher_entry');
                const entriesToDelete = voucherEntries.filter(entry => entry.voucher_id === voucherId);
                
                for (const entry of entriesToDelete) {
                    await schema.deleteDoc(entry);
                }
                
                // Delete voucher
                await schema.deleteDoc(voucher);
                
                app.showToast('Voucher deleted successfully', 'success');
                await this.loadVouchersTable();
                await this.updateSummary();
            }
        } catch (error) {
            console.error('Error deleting voucher:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    }
};

// Export the module
window.vouchersModule = vouchersModule;