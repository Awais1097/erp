// Accounts Module
const accountsModule = {
    async load() {
        if (!authManager.hasPermission('accounts')) {
            document.getElementById('content-area').innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="bi bi-shield-exclamation"></i> Access Denied</h4>
                    <p>You don't have permission to access the Accounts module.</p>
                </div>
            `;
            return;
        }
        
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4><i class="bi bi-journal-bookmark"></i> Chart of Accounts</h4>
                    <p class="text-muted">Manage accounts and track financial transactions</p>
                </div>
                <div>
                    <button class="btn btn-primary" onclick="accountsModule.showAccountForm()">
                        <i class="bi bi-plus-circle"></i> New Account
                    </button>
                    <button class="btn btn-outline-secondary ms-2" onclick="accountsModule.exportAccounts()">
                        <i class="bi bi-download"></i> Export
                    </button>
                </div>
            </div>
            
            <!-- Account Summary -->
            <div class="row mb-4">
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Total Accounts</h6>
                            <h3 id="total-accounts">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Assets</h6>
                            <h3 id="asset-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Liabilities</h6>
                            <h3 id="liability-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Suppliers</h6>
                            <h3 id="supplier-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Buyers</h6>
                            <h3 id="buyer-count">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Process Parties</h6>
                            <h3 id="process-count">0</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Account Type</label>
                            <select class="form-select" id="filterType" onchange="accountsModule.filterAccounts()">
                                <option value="">All Types</option>
                                <option value="asset">Asset</option>
                                <option value="liability">Liability</option>
                                <option value="income">Income</option>
                                <option value="expense">Expense</option>
                                <option value="supplier">Supplier</option>
                                <option value="buyer">Buyer</option>
                                <option value="dying_party">Dying Party</option>
                                <option value="packing_party">Packing Party</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Level</label>
                            <select class="form-select" id="filterLevel" onchange="accountsModule.filterAccounts()">
                                <option value="">All Levels</option>
                                <option value="1">Level 1</option>
                                <option value="2">Level 2</option>
                                <option value="3">Level 3</option>
                                <option value="4">Level 4</option>
                                <option value="5">Level 5</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="filterStatus" onchange="accountsModule.filterAccounts()">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Search</label>
                            <input type="text" class="form-control" id="searchAccount" 
                                   placeholder="Account name..." onkeyup="accountsModule.filterAccounts()">
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
                                    <th>Account Code</th>
                                    <th>Account Name</th>
                                    <th>Type</th>
                                    <th>Level</th>
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
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <span id="account-count">0</span> accounts found
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
        await this.loadAccountsTable();
        await this.updateSummary();
    },

    async loadAccountsTable(page = 1, itemsPerPage = 10) {
        try {
            const accounts = await schema.findDocs('account');
            
            // Apply filters
            let filtered = this.applyFilters(accounts);
            
            // Sort by account code
            filtered.sort((a, b) => a.account_code?.localeCompare(b.account_code));
            
            // Calculate pagination
            const total = filtered.length;
            const totalPages = Math.ceil(total / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginated = filtered.slice(startIndex, endIndex);
            
            // Generate table rows
            const html = paginated.map(account => {
                // Get parent account name if exists
                let parentName = '';
                if (account.parent_account_id) {
                    const parent = accounts.find(a => a._id === account.parent_account_id);
                    parentName = parent ? `<small class="text-muted d-block">Parent: ${parent.account_name}</small>` : '';
                }
                
                // Calculate current balance (simplified - in real app, calculate from vouchers)
                const currentBalance = account.opening_balance || 0;
                
                return `
                    <tr>
                        <td>
                            <div class="fw-bold">${account.account_code || 'N/A'}</div>
                        </td>
                        <td>
                            <div>${account.account_name}</div>
                            ${parentName}
                        </td>
                        <td>
                            <span class="account-type-badge ${account.account_type}">
                                ${account.account_type}
                            </span>
                        </td>
                        <td>
                            <span class="badge bg-secondary">${account.level || 1}</span>
                        </td>
                        <td>
                            <div>Rs${account.opening_balance?.toFixed(2) || '0.00'}</div>
                            <small class="text-muted">${account.opening_type || 'DR'}</small>
                        </td>
                        <td>
                            <div class="${currentBalance >= 0 ? 'text-success' : 'text-danger'}">
                                Rs${currentBalance.toFixed(2)}
                            </div>
                        </td>
                        <td>
                            <span class="badge ${account.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                                ${account.status}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="accountsModule.viewAccount('${account._id}')">
                                    <i class="bi bi-eye"></i>
                                </button>
                                ${authManager.getCurrentUser().role === 'admin' ? `
                                <button class="btn btn-outline-warning" onclick="accountsModule.editAccount('${account._id}')">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-outline-danger" onclick="accountsModule.deleteAccount('${account._id}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('accounts-table-body').innerHTML = 
                html || '<tr><td colspan="8" class="text-center">No accounts found</td></tr>';
            
            document.getElementById('account-count').textContent = total;
            this.generatePagination(page, totalPages);
            
        } catch (error) {
            console.error('Error loading accounts:', error);
        }
    },

    applyFilters(accounts) {
        const type = document.getElementById('filterType').value;
        const level = document.getElementById('filterLevel').value;
        const status = document.getElementById('filterStatus').value;
        const search = document.getElementById('searchAccount').value.toLowerCase();
        
        return accounts.filter(account => {
            if (type && account.account_type !== type) return false;
            if (level && account.level !== parseInt(level)) return false;
            if (status && account.status !== status) return false;
            
            if (search) {
                const name = account.account_name.toLowerCase();
                const code = account.account_code?.toLowerCase() || '';
                return name.includes(search) || code.includes(search);
            }
            
            return true;
        });
    },

    generatePagination(currentPage, totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" onclick="accountsModule.loadAccountsTable(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>`;
        pagination.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                const li = document.createElement('li');
                li.className = `page-item ${i === currentPage ? 'active' : ''}`;
                li.innerHTML = `<a class="page-link" href="#" onclick="accountsModule.loadAccountsTable(${i})">${i}</a>`;
                pagination.appendChild(li);
            }
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" onclick="accountsModule.loadAccountsTable(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>`;
        pagination.appendChild(nextLi);
    },

    async updateSummary() {
        try {
            const accounts = await schema.findDocs('account');
            
            const total = accounts.length;
            const assets = accounts.filter(a => a.account_type === 'asset').length;
            const liabilities = accounts.filter(a => a.account_type === 'liability').length;
            const suppliers = accounts.filter(a => a.account_type === 'supplier').length;
            const buyers = accounts.filter(a => a.account_type === 'buyer').length;
            const processParties = accounts.filter(a => 
                a.account_type === 'dying_party' || a.account_type === 'packing_party'
            ).length;
            
            document.getElementById('total-accounts').textContent = total;
            document.getElementById('asset-count').textContent = assets;
            document.getElementById('liability-count').textContent = liabilities;
            document.getElementById('supplier-count').textContent = suppliers;
            document.getElementById('buyer-count').textContent = buyers;
            document.getElementById('process-count').textContent = processParties;
            
        } catch (error) {
            console.error('Error updating summary:', error);
        }
    },

    filterAccounts() {
        this.loadAccountsTable(1);
    },

    async showAccountForm(accountId = null) {
        try {
            const accounts = await schema.findDocs('account');
            
            let accountData = {};
            if (accountId) {
                const account = await schema.getDoc(accountId);
                accountData = account;
            }
            
            // Get parent account options (only accounts with level < 5)
            const parentOptions = accounts
                .filter(a => a.level < 5)
                .map(a => `<option value="${a._id}" ${accountData.parent_account_id === a._id ? 'selected' : ''}>${a.account_name} (Level ${a.level})</option>`)
                .join('');
            
            const formHtml = `
                <form id="accountForm" onsubmit="return accountsModule.saveAccount(event)">
                    ${accountId ? `<input type="hidden" id="accountId" value="${accountId}">` : ''}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Account Name *</label>
                            <input type="text" class="form-control" id="accountName" 
                                   value="${accountData.account_name || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Account Code *</label>
                            <input type="text" class="form-control" id="accountCode" 
                                   value="${accountData.account_code || ''}" required>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Account Type *</label>
                            <select class="form-select" id="accountType" required>
                                <option value="">Select Type</option>
                                <option value="asset" ${accountData.account_type === 'asset' ? 'selected' : ''}>Asset</option>
                                <option value="liability" ${accountData.account_type === 'liability' ? 'selected' : ''}>Liability</option>
                                <option value="income" ${accountData.account_type === 'income' ? 'selected' : ''}>Income</option>
                                <option value="expense" ${accountData.account_type === 'expense' ? 'selected' : ''}>Expense</option>
                                <option value="supplier" ${accountData.account_type === 'supplier' ? 'selected' : ''}>Supplier</option>
                                <option value="buyer" ${accountData.account_type === 'buyer' ? 'selected' : ''}>Buyer</option>
                                <option value="dying_party" ${accountData.account_type === 'dying_party' ? 'selected' : ''}>Dying Party</option>
                                <option value="packing_party" ${accountData.account_type === 'packing_party' ? 'selected' : ''}>Packing Party</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Parent Account</label>
                            <select class="form-select" id="parentAccountId">
                                <option value="">No Parent (Root Account)</option>
                                ${parentOptions}
                            </select>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Level *</label>
                            <select class="form-select" id="level" required>
                                <option value="1" ${accountData.level === 1 ? 'selected' : ''}>1</option>
                                <option value="2" ${accountData.level === 2 ? 'selected' : ''}>2</option>
                                <option value="3" ${accountData.level === 3 ? 'selected' : ''}>3</option>
                                <option value="4" ${accountData.level === 4 ? 'selected' : ''}>4</option>
                                <option value="5" ${accountData.level === 5 ? 'selected' : ''}>5</option>
                            </select>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Opening Balance</label>
                            <input type="number" class="form-control" id="openingBalance" 
                                   value="${accountData.opening_balance || 0}" step="0.01">
                        </div>
                        <div class="col-md-4 mb-3">
                            <label class="form-label">Opening Type</label>
                            <select class="form-select" id="openingType">
                                <option value="DR" ${accountData.opening_type === 'DR' ? 'selected' : ''}>Debit (DR)</option>
                                <option value="CR" ${accountData.opening_type === 'CR' ? 'selected' : ''}>Credit (CR)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Contact Details</label>
                        <textarea class="form-control" id="contactDetails" rows="2">${accountData.contact_details || ''}</textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Address</label>
                        <textarea class="form-control" id="address" rows="2">${accountData.address || ''}</textarea>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="status">
                            <option value="active" ${accountData.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${accountData.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                    
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary">
                            ${accountId ? 'Update' : 'Save'} Account
                        </button>
                    </div>
                </form>
            `;
            
            app.showModal(accountId ? 'Edit Account' : 'Create New Account', formHtml);
            
        } catch (error) {
            console.error('Error showing account form:', error);
            app.showToast('Error loading form: ' + error.message, 'danger');
        }
    },

    async saveAccount(event) {
        event.preventDefault();
        
        try {
            const accountId = document.getElementById('accountId')?.value;
            
            const accountData = {
                account_name: document.getElementById('accountName').value,
                account_code: document.getElementById('accountCode').value,
                account_type: document.getElementById('accountType').value,
                parent_account_id: document.getElementById('parentAccountId').value || null,
                level: parseInt(document.getElementById('level').value),
                opening_balance: parseFloat(document.getElementById('openingBalance').value) || 0,
                opening_type: document.getElementById('openingType').value,
                contact_details: document.getElementById('contactDetails').value,
                address: document.getElementById('address').value,
                status: document.getElementById('status').value
            };
            
            if (accountId) {
                const existing = await schema.getDoc(accountId);
                await schema.updateDoc({ ...existing, ...accountData });
                app.showToast('Account updated successfully!', 'success');
            } else {
                await schema.createDoc('account', accountData);
                app.showToast('Account created successfully!', 'success');
            }
            
            app.hideModal();
            await this.loadAccountsTable();
            await this.updateSummary();
            
        } catch (error) {
            console.error('Error saving account:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async viewAccount(accountId) {
        try {
            const account = await schema.getDoc(accountId);
            const accounts = await schema.findDocs('account');
            const parent = account.parent_account_id ? 
                accounts.find(a => a._id === account.parent_account_id) : null;
            
            // Get account transactions (vouchers)
            const vouchers = await schema.findDocs('voucher');
            const voucherEntries = await schema.findDocs('voucher_entry');
            
            const accountVouchers = voucherEntries
                .filter(entry => entry.account_id === accountId)
                .map(entry => {
                    const voucher = vouchers.find(v => v._id === entry.voucher_id);
                    return {
                        ...entry,
                        voucher: voucher
                    };
                })
                .sort((a, b) => new Date(b.voucher?.voucher_date) - new Date(a.voucher?.voucher_date))
                .slice(0, 10);
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Account Name</th><td>${account.account_name}</td></tr>
                            <tr><th>Account Code</th><td>${account.account_code || 'N/A'}</td></tr>
                            <tr><th>Account Type</th><td><span class="account-type-badge ${account.account_type}">${account.account_type}</span></td></tr>
                            <tr><th>Parent Account</th><td>${parent?.account_name || 'None (Root)'}</td></tr>
                            <tr><th>Level</th><td>${account.level}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Opening Balance</th><td>Rs${account.opening_balance?.toFixed(2) || '0.00'} ${account.opening_type || ''}</td></tr>
                            <tr><th>Status</th><td><span class="badge ${account.status === 'active' ? 'bg-success' : 'bg-secondary'}">${account.status}</span></td></tr>
                            <tr><th>Created Date</th><td>${new Date(account.created_at).toLocaleString()}</td></tr>
                            <tr><th>Updated Date</th><td>${new Date(account.updated_at).toLocaleString()}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <h6>Contact Details</h6>
                        <div class="alert alert-info">
                            ${account.contact_details || 'No contact details'}
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Address</h6>
                        <div class="alert alert-info">
                            ${account.address || 'No address'}
                        </div>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Recent Transactions</h6>
                    <div class="table-responsive">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Voucher</th>
                                    <th>Type</th>
                                    <th>Debit</th>
                                    <th>Credit</th>
                                    <th>Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${accountVouchers.map(entry => `
                                    <tr>
                                        <td>${new Date(entry.voucher?.voucher_date).toLocaleDateString()}</td>
                                        <td>${entry.voucher?.voucher_type} - ${entry.voucher?.voucher_number}</td>
                                        <td>${entry.voucher?.voucher_type}</td>
                                        <td class="text-success">${entry.debit ? 'Rs' + entry.debit.toFixed(2) : '-'}</td>
                                        <td class="text-danger">${entry.credit ? 'Rs' + entry.credit.toFixed(2) : '-'}</td>
                                        <td class="fw-bold">Rs${((entry.debit || 0) - (entry.credit || 0)).toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                                ${accountVouchers.length === 0 ? '<tr><td colspan="6" class="text-center">No transactions found</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-outline-primary" onclick="accountsModule.editAccount('${accountId}')">
                        <i class="bi bi-pencil"></i> Edit Account
                    </button>
                </div>
            `;
            
            app.showModal('Account Details - ' + account.account_name, content);
            
        } catch (error) {
            console.error('Error viewing account:', error);
            app.showToast('Error loading details', 'danger');
        }
    },

    async editAccount(accountId) {
        await this.showAccountForm(accountId);
    },

    async deleteAccount(accountId) {
        try {
            if (confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
                const account = await schema.getDoc(accountId);
                account.status = 'inactive';
                await schema.updateDoc(account);
                
                app.showToast('Account marked as inactive', 'success');
                await this.loadAccountsTable();
                await this.updateSummary();
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async exportAccounts() {
        try {
            const accounts = await schema.findDocs('account');
            
            // Create CSV
            let csv = 'Account Code,Account Name,Type,Level,Opening Balance,Opening Type,Status\n';
            
            accounts.forEach(account => {
                const row = [
                    account.account_code || '',
                    account.account_name,
                    account.account_type,
                    account.level,
                    account.opening_balance,
                    account.opening_type,
                    account.status
                ];
                csv += row.map(field => `"${field}"`).join(',') + '\n';
            });
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `accounts_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            app.showToast('Accounts exported successfully', 'success');
            
        } catch (error) {
            console.error('Error exporting accounts:', error);
            app.showToast('Error exporting accounts', 'danger');
        }
    }
};

// Export the module
window.accountsModule = accountsModule;