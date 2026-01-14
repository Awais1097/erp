// Reports Module
const reportsModule = {
    async load() {
        if (!authManager.hasPermission('reports')) {
            document.getElementById('content-area').innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="bi bi-shield-exclamation"></i> Access Denied</h4>
                    <p>You don't have permission to access the Reports module.</p>
                </div>
            `;
            return;
        }

        const content = `
            <div class="mb-4">
                <h4><i class="bi bi-graph-up"></i> Reports & Analytics</h4>
                <p class="text-muted">Generate comprehensive reports and analytics</p>
            </div>
            
            <!-- Report Cards -->
        <div class="row mb-4">
            <div class="col-md-3 mb-3">
                <div class="card card-hover text-center">
                    <div class="card-body">
                        <i class="bi bi-bar-chart display-4 text-primary mb-3"></i>
                        <h5>Stock Report</h5>
                        <p class="text-muted">Current stock levels by stage</p>
                        <button class="btn btn-outline-primary" onclick="reportsModule.generateStockReport()">
                            Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card card-hover text-center">
                    <div class="card-body">
                        <i class="bi bi-cash-coin display-4 text-success mb-3"></i>
                        <h5>Profit & Loss</h5>
                        <p class="text-muted">Monthly profit and loss statement</p>
                        <button class="btn btn-outline-success" onclick="reportsModule.generateProfitLoss()">
                            Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card card-hover text-center">
                    <div class="card-body">
                        <i class="bi bi-journal-text display-4 text-info mb-3"></i>
                        <h5>Ledger Report</h5>
                        <p class="text-muted">Account ledger with trail balance</p>
                        <button class="btn btn-outline-info" onclick="reportsModule.generateLedgerReport()">
                            Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card card-hover text-center">
                    <div class="card-body">
                        <i class="bi bi-clipboard-data display-4 text-warning mb-3"></i>
                        <h5>Trial Balance</h5>
                        <p class="text-muted">Complete trial balance report</p>
                        <button class="btn btn-outline-warning" onclick="reportsModule.generateTrailBalanceReport()">
                            Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Second Row -->
            <div class="col-md-3 mb-3">
                <div class="card card-hover text-center">
                    <div class="card-body">
                        <i class="bi bi-receipt display-4 text-warning mb-3"></i>
                        <h5>Voucher Report</h5>
                        <p class="text-muted">All voucher transactions</p>
                        <button class="btn btn-outline-warning" onclick="reportsModule.generateVoucherReport()">
                            Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card card-hover text-center">
                    <div class="card-body">
                        <i class="bi bi-box-seam display-4 text-info mb-3"></i>
                        <h5>Lot Traceability</h5>
                        <p class="text-muted">Complete lot journey report</p>
                        <button class="btn btn-outline-info" onclick="reportsModule.generateLotTraceability()">
                            Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card card-hover text-center">
                    <div class="card-body">
                        <i class="bi bi-cash-stack display-4 text-danger mb-3"></i>
                        <h5>Sales Report</h5>
                        <p class="text-muted">Sales analysis by buyer</p>
                        <button class="btn btn-outline-danger" onclick="reportsModule.generateSalesReport()">
                            Generate
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="col-md-3 mb-3">
                <div class="card card-hover text-center">
                    <div class="card-body">
                        <i class="bi bi-cart display-4 text-primary mb-3"></i>
                        <h5>Purchase Report</h5>
                        <p class="text-muted">Purchase analysis by supplier</p>
                        <button class="btn btn-outline-primary" onclick="reportsModule.generatePurchaseReport()">
                            Generate
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Rest of the existing content -->
            
            <!-- Report Filters -->
            <div class="card mb-4">
                <div class="card-header">
                    <h6>Report Parameters</h6>
                </div>
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Report Type</label>
                            <select class="form-select" id="reportType">
                                <option value="stock">Stock Report</option>
    <option value="sales">Sales Report</option>
    <option value="purchase">Purchase Report</option>
    <option value="costing">Costing Report</option>
    <option value="profit">Profit Report</option>
    <option value="ledger">Ledger Report</option>
    <option value="trail_balance">Trial Balance</option>
    <option value="voucher">Voucher Report</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date From</label>
                            <input type="date" class="form-control" id="reportDateFrom">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date To</label>
                            <input type="date" class="form-control" id="reportDateTo">
                        </div>
                        <div class="col-md-3 d-flex align-items-end">
                            <button class="btn btn-primary w-100" onclick="reportsModule.generateCustomReport()">
                                <i class="bi bi-file-earmark-text"></i> Generate Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Report Output -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6>Report Output</h6>
                    <button class="btn btn-sm btn-outline-secondary" onclick="reportsModule.exportReport()">
                        <i class="bi bi-download"></i> Export
                    </button>
                </div>
                <div class="card-body">
                    <div id="reportOutput">
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-file-earmark-text display-4"></i>
                            <p class="mt-3">No report generated yet. Select parameters and generate a report.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('content-area').innerHTML = content;

        // Set default dates
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

        document.getElementById('reportDateFrom').value = firstDay.toISOString().split('T')[0];
        document.getElementById('reportDateTo').value = today.toISOString().split('T')[0];
    },

    // Add these methods to the reportsModule object

    async generateLedgerReport() {
        try {
            app.showLoading(true);

            const accounts = await schema.findDocs('account');
            const vouchers = await schema.findDocs('voucher');
            const voucherEntries = await schema.findDocs('voucher_entry');

            const dateFrom = document.getElementById('reportDateFrom').value;
            const dateTo = document.getElementById('reportDateTo').value;

            // Create account selector
            const accountOptions = accounts
                .filter(a => a.status === 'active')
                .map(a => `<option value="${a._id}">${a.account_code} - ${a.account_name} (${a.account_type})</option>`)
                .join('');

            let reportHtml = `
            <h5 class="mb-4">Ledger Report</h5>
            <p class="text-muted">Generate ledger for any account with trail balance</p>
            
            <div class="row mb-4">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <label class="form-label">Select Account *</label>
                                    <select class="form-select" id="ledgerAccount" onchange="reportsModule.loadLedgerData()">
                                        <option value="">Select Account</option>
                                        ${accountOptions}
                                    </select>
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Date From</label>
                                    <input type="date" class="form-control" id="ledgerDateFrom" 
                                           value="${dateFrom}" onchange="reportsModule.loadLedgerData()">
                                </div>
                                <div class="col-md-3">
                                    <label class="form-label">Date To</label>
                                    <input type="date" class="form-control" id="ledgerDateTo" 
                                           value="${dateTo}" onchange="reportsModule.loadLedgerData()">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body text-center">
                            <h6>Report Actions</h6>
                            <button class="btn btn-outline-primary w-100 mb-2" onclick="reportsModule.printLedger()">
                                <i class="bi bi-printer"></i> Print Ledger
                            </button>
                            <button class="btn btn-outline-success w-100" onclick="reportsModule.exportLedger()">
                                <i class="bi bi-download"></i> Export as PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="ledgerDataContainer">
                <div class="text-center text-muted py-5">
                    <i class="bi bi-journal-text display-4"></i>
                    <p class="mt-3">Select an account to generate ledger report</p>
                </div>
            </div>
        `;

            document.getElementById('reportOutput').innerHTML = reportHtml;
            app.showLoading(false);

        } catch (error) {
            console.error('Error generating ledger report:', error);
            app.showToast('Error generating report', 'danger');
            app.showLoading(false);
        }
    },

    async loadLedgerData() {
        try {
            const accountId = document.getElementById('ledgerAccount').value;
            const dateFrom = document.getElementById('ledgerDateFrom').value;
            const dateTo = document.getElementById('ledgerDateTo').value;

            if (!accountId) {
                return;
            }

            app.showLoading(true);

            const account = await schema.getDoc(accountId);
            const vouchers = await schema.findDocs('voucher');
            const voucherEntries = await schema.findDocs('voucher_entry');
            const accounts = await schema.findDocs('account');

            // Filter voucher entries for this account
            let filteredEntries = voucherEntries.filter(entry => entry.account_id === accountId);

            // Apply date filter
            if (dateFrom && dateTo) {
                filteredEntries = filteredEntries.filter(entry => {
                    const voucher = vouchers.find(v => v._id === entry.voucher_id);
                    if (!voucher) return false;

                    const entryDate = new Date(voucher.voucher_date);
                    const fromDate = new Date(dateFrom);
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);

                    return entryDate >= fromDate && entryDate <= toDate;
                });
            }

            // Sort by date
            filteredEntries.sort((a, b) => {
                const voucherA = vouchers.find(v => v._id === a.voucher_id);
                const voucherB = vouchers.find(v => v._id === b.voucher_id);
                return new Date(voucherA.voucher_date) - new Date(voucherB.voucher_date);
            });

            // Calculate running balance
            let runningBalance = account.opening_balance || 0;
            if (account.opening_type === 'CR') {
                runningBalance = -runningBalance;
            }

            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);

            // Generate ledger entries
            const ledgerEntries = filteredEntries.map(entry => {
                const voucher = vouchers.find(v => v._id === entry.voucher_id);

                // Calculate balance
                let debit = entry.debit || 0;
                let credit = entry.credit || 0;

                if (account.account_type === 'asset' || account.account_type === 'expense') {
                    runningBalance += debit - credit;
                } else {
                    runningBalance += credit - debit;
                }

                // Find contra account
                let contraAccount = '';
                const contraEntries = voucherEntries.filter(e =>
                    e.voucher_id === voucher._id && e.account_id !== accountId
                );
                if (contraEntries.length > 0) {
                    const contraEntry = contraEntries[0];
                    const contraAcc = accountMap[contraEntry.account_id];
                    if (contraAcc) {
                        contraAccount = `${contraAcc.account_code} - ${contraAcc.account_name}`;
                    }
                }

                return {
                    date: voucher.voucher_date,
                    voucher_no: voucher.voucher_number,
                    voucher_type: voucher.voucher_type,
                    narration: voucher.narration,
                    debit: debit,
                    credit: credit,
                    balance: runningBalance,
                    contra_account: contraAccount
                };
            });

            // Calculate summary
            const totalDebit = ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0);
            const totalCredit = ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0);
            const openingBalance = account.opening_balance || 0;
            const openingType = account.opening_type || 'DR';
            const closingBalance = runningBalance;

            // Generate ledger HTML
            let ledgerHtml = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">
                        ${account.account_code} - ${account.account_name}
                        <small class="text-muted float-end">${account.account_type.toUpperCase()}</small>
                    </h5>
                </div>
                <div class="card-body">
                    <!-- Summary -->
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="card text-center">
                                <div class="card-body p-3">
                                    <h6 class="text-muted">Opening Balance</h6>
                                    <h4 class="${openingBalance >= 0 ? 'text-success' : 'text-danger'}">
                                        Rs${Math.abs(openingBalance).toFixed(2)} ${openingType}
                                    </h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card text-center">
                                <div class="card-body p-3">
                                    <h6 class="text-muted">Total Debit</h6>
                                    <h4 class="text-success">Rs${totalDebit.toFixed(2)}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card text-center">
                                <div class="card-body p-3">
                                    <h6 class="text-muted">Total Credit</h6>
                                    <h4 class="text-danger">Rs${totalCredit.toFixed(2)}</h4>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="card text-center">
                                <div class="card-body p-3">
                                    <h6 class="text-muted">Closing Balance</h6>
                                    <h4 class="${closingBalance >= 0 ? 'text-success' : 'text-danger'}">
                                        Rs${Math.abs(closingBalance).toFixed(2)} ${closingBalance >= 0 ? 'DR' : 'CR'}
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Ledger Table -->
                    <div class="table-responsive">
                        <table class="table table-bordered table-hover">
                            <thead class="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Voucher No</th>
                                    <th>Type</th>
                                    <th>Narration</th>
                                    <th>Contra Account</th>
                                    <th class="text-end">Debit (Rs)</th>
                                    <th class="text-end">Credit (Rs)</th>
                                    <th class="text-end">Balance (Rs)</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Opening Balance Row -->
                                <tr class="table-info">
                                    <td colspan="5" class="text-end fw-bold">Opening Balance</td>
                                    <td class="text-end fw-bold ${openingType === 'DR' ? 'text-success' : ''}">
                                        ${openingType === 'DR' ? `Rs${openingBalance.toFixed(2)}` : ''}
                                    </td>
                                    <td class="text-end fw-bold ${openingType === 'CR' ? 'text-danger' : ''}">
                                        ${openingType === 'CR' ? `Rs${openingBalance.toFixed(2)}` : ''}
                                    </td>
                                    <td class="text-end fw-bold ${openingBalance >= 0 ? 'text-success' : 'text-danger'}">
                                        Rs${Math.abs(openingBalance).toFixed(2)} ${openingType}
                                    </td>
                                </tr>
                                
                                <!-- Ledger Entries -->
                                ${ledgerEntries.map(entry => `
                                    <tr>
                                        <td>${new Date(entry.date).toLocaleDateString()}</td>
                                        <td>
                                            <span class="badge ${this.getVoucherTypeBadge(entry.voucher_type)}">
                                                ${entry.voucher_no}
                                            </span>
                                        </td>
                                        <td>${entry.voucher_type}</td>
                                        <td>${entry.narration || '-'}</td>
                                        <td>${entry.contra_account || '-'}</td>
                                        <td class="text-end text-success">
                                            ${entry.debit > 0 ? `Rs${entry.debit.toFixed(2)}` : '-'}
                                        </td>
                                        <td class="text-end text-danger">
                                            ${entry.credit > 0 ? `Rs${entry.credit.toFixed(2)}` : '-'}
                                        </td>
                                        <td class="text-end fw-bold ${entry.balance >= 0 ? 'text-success' : 'text-danger'}">
                                            Rs${Math.abs(entry.balance).toFixed(2)} ${entry.balance >= 0 ? 'DR' : 'CR'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot class="table-active">
                                <tr>
                                    <td colspan="5" class="text-end fw-bold">Totals</td>
                                    <td class="text-end fw-bold text-success">Rs${totalDebit.toFixed(2)}</td>
                                    <td class="text-end fw-bold text-danger">Rs${totalCredit.toFixed(2)}</td>
                                    <td class="text-end fw-bold ${closingBalance >= 0 ? 'text-success' : 'text-danger'}">
                                        Rs${Math.abs(closingBalance).toFixed(2)} ${closingBalance >= 0 ? 'DR' : 'CR'}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <!-- Trail Balance -->
                    <div class="mt-4">
                        <h6>Trail Balance Summary</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Debit Side</h6>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-sm">
                                            <tr>
                                                <td>Opening Balance (DR)</td>
                                                <td class="text-end">${openingType === 'DR' ? `Rs${openingBalance.toFixed(2)}` : 'Rs0.00'}</td>
                                            </tr>
                                            <tr>
                                                <td>Total Debit Entries</td>
                                                <td class="text-end">Rs${totalDebit.toFixed(2)}</td>
                                            </tr>
                                            <tr class="table-active">
                                                <td><strong>Total Debit</strong></td>
                                                <td class="text-end fw-bold">
                                                    Rs${(totalDebit + (openingType === 'DR' ? openingBalance : 0)).toFixed(2)}
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-header">
                                        <h6 class="mb-0">Credit Side</h6>
                                    </div>
                                    <div class="card-body">
                                        <table class="table table-sm">
                                            <tr>
                                                <td>Opening Balance (CR)</td>
                                                <td class="text-end">${openingType === 'CR' ? `Rs${openingBalance.toFixed(2)}` : 'Rs0.00'}</td>
                                            </tr>
                                            <tr>
                                                <td>Total Credit Entries</td>
                                                <td class="text-end">Rs${totalCredit.toFixed(2)}</td>
                                            </tr>
                                            <tr class="table-active">
                                                <td><strong>Total Credit</strong></td>
                                                <td class="text-end fw-bold">
                                                    Rs${(totalCredit + (openingType === 'CR' ? openingBalance : 0)).toFixed(2)}
                                                </td>
                                            </tr>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Net Balance -->
                        <div class="card mt-3 ${closingBalance === 0 ? 'bg-success text-white' : 'bg-warning'}">
                            <div class="card-body text-center">
                                <h5 class="mb-0">
                                    Net Balance: Rs${Math.abs(closingBalance).toFixed(2)} ${closingBalance >= 0 ? 'DR' : 'CR'}
                                    ${closingBalance === 0 ? '<span class="badge bg-light text-dark ms-2">Balanced</span>' :
                    '<span class="badge bg-danger ms-2">Unbalanced</span>'}
                                </h5>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <small class="text-muted">
                        Generated on ${new Date().toLocaleString()} | 
                        Period: ${dateFrom} to ${dateTo} | 
                        Entries: ${ledgerEntries.length}
                    </small>
                </div>
            </div>
        `;

            document.getElementById('ledgerDataContainer').innerHTML = ledgerHtml;
            app.showLoading(false);

        } catch (error) {
            console.error('Error loading ledger data:', error);
            app.showToast('Error loading ledger', 'danger');
            app.showLoading(false);
        }
    },

    async generateTrailBalanceReport() {
        try {
            app.showLoading(true);

            const accounts = await schema.findDocs('account');
            const vouchers = await schema.findDocs('voucher');
            const voucherEntries = await schema.findDocs('voucher_entry');

            const dateFrom = document.getElementById('reportDateFrom').value;
            const dateTo = document.getElementById('reportDateTo').value;

            // Calculate trail balance for each account
            const trailBalance = [];
            let totalDebit = 0;
            let totalCredit = 0;

            for (const account of accounts) {
                if (account.status !== 'active') continue;

                // Get opening balance
                let openingBalance = account.opening_balance || 0;
                if (account.opening_type === 'CR') {
                    openingBalance = -openingBalance;
                }

                // Get transactions for period
                let periodDebit = 0;
                let periodCredit = 0;

                const accountEntries = voucherEntries.filter(entry => entry.account_id === account._id);

                for (const entry of accountEntries) {
                    const voucher = vouchers.find(v => v._id === entry.voucher_id);
                    if (!voucher) continue;

                    // Check date range
                    if (dateFrom && dateTo) {
                        const entryDate = new Date(voucher.voucher_date);
                        const fromDate = new Date(dateFrom);
                        const toDate = new Date(dateTo);
                        toDate.setHours(23, 59, 59, 999);

                        if (entryDate < fromDate || entryDate > toDate) {
                            continue;
                        }
                    }

                    periodDebit += entry.debit || 0;
                    periodCredit += entry.credit || 0;
                }

                // Calculate closing balance based on account type
                let closingBalance;
                if (account.account_type === 'asset' || account.account_type === 'expense') {
                    closingBalance = openingBalance + periodDebit - periodCredit;
                } else {
                    closingBalance = openingBalance + periodCredit - periodDebit;
                }

                // Add to totals
                if (closingBalance >= 0) {
                    totalDebit += closingBalance;
                } else {
                    totalCredit += Math.abs(closingBalance);
                }

                trailBalance.push({
                    account: account,
                    opening_balance: openingBalance,
                    opening_type: account.opening_type,
                    period_debit: periodDebit,
                    period_credit: periodCredit,
                    closing_balance: closingBalance,
                    balance_type: closingBalance >= 0 ? 'DR' : 'CR'
                });
            }

            // Sort by account type and code
            trailBalance.sort((a, b) => {
                if (a.account.account_type !== b.account.account_type) {
                    return a.account.account_type.localeCompare(b.account.account_type);
                }
                return a.account.account_code?.localeCompare(b.account.account_code);
            });

            // Group by account type
            const groupedByType = {};
            trailBalance.forEach(item => {
                const type = item.account.account_type;
                if (!groupedByType[type]) {
                    groupedByType[type] = [];
                }
                groupedByType[type].push(item);
            });

            let reportHtml = `
            <h5 class="mb-4">Trial Balance Report</h5>
            <p class="text-muted">Period: ${dateFrom} to ${dateTo}</p>
            
            <!-- Summary -->
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Total Debit</h6>
                            <h3 class="text-success">Rs${totalDebit.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Total Credit</h6>
                            <h3 class="text-danger">Rs${totalCredit.toFixed(2)}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card text-center ${totalDebit === totalCredit ? 'bg-success text-white' : 'bg-danger text-white'}">
                        <div class="card-body">
                            <h6 class="mb-0">Balance Status</h6>
                            <h3 class="mb-0">
                                Rs${Math.abs(totalDebit - totalCredit).toFixed(2)}
                                ${totalDebit === totalCredit ? 'Balanced' : 'Unbalanced'}
                            </h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Trail Balance Table -->
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h6 class="mb-0">Trial Balance Details</h6>
                    <button class="btn btn-sm btn-outline-primary" onclick="reportsModule.exportTrailBalance()">
                        <i class="bi bi-download"></i> Export
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead class="table-light">
                                <tr>
                                    <th colspan="3">Account</th>
                                    <th class="text-center" colspan="2">Opening Balance</th>
                                    <th class="text-center" colspan="2">Period Transactions</th>
                                    <th class="text-center" colspan="2">Closing Balance</th>
                                </tr>
                                <tr>
                                    <th>Code</th>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th class="text-end">Debit</th>
                                    <th class="text-end">Credit</th>
                                    <th class="text-end">Debit</th>
                                    <th class="text-end">Credit</th>
                                    <th class="text-end">Debit</th>
                                    <th class="text-end">Credit</th>
                                </tr>
                            </thead>
                            <tbody>
        `;

            // Generate rows for each account type
            for (const [type, items] of Object.entries(groupedByType)) {
                let typeDebit = 0;
                let typeCredit = 0;
                let typePeriodDebit = 0;
                let typePeriodCredit = 0;
                let typeClosingDebit = 0;
                let typeClosingCredit = 0;

                reportHtml += `
                <tr class="table-info">
                    <td colspan="9" class="fw-bold">
                        <i class="bi bi-folder me-2"></i>${type.toUpperCase()} ACCOUNTS
                    </td>
                </tr>
            `;

                items.forEach(item => {
                    const openingDebit = item.opening_type === 'DR' ? item.opening_balance : 0;
                    const openingCredit = item.opening_type === 'CR' ? Math.abs(item.opening_balance) : 0;
                    const closingDebit = item.balance_type === 'DR' ? Math.abs(item.closing_balance) : 0;
                    const closingCredit = item.balance_type === 'CR' ? Math.abs(item.closing_balance) : 0;

                    typeDebit += openingDebit;
                    typeCredit += openingCredit;
                    typePeriodDebit += item.period_debit;
                    typePeriodCredit += item.period_credit;
                    typeClosingDebit += closingDebit;
                    typeClosingCredit += closingCredit;

                    reportHtml += `
                    <tr>
                        <td>${item.account.account_code || '-'}</td>
                        <td>${item.account.account_name}</td>
                        <td><span class="account-type-badge ${type}">${type}</span></td>
                        <td class="text-end">${openingDebit > 0 ? `Rs${openingDebit.toFixed(2)}` : '-'}</td>
                        <td class="text-end">${openingCredit > 0 ? `Rs${openingCredit.toFixed(2)}` : '-'}</td>
                        <td class="text-end text-success">${item.period_debit > 0 ? `Rs${item.period_debit.toFixed(2)}` : '-'}</td>
                        <td class="text-end text-danger">${item.period_credit > 0 ? `Rs${item.period_credit.toFixed(2)}` : '-'}</td>
                        <td class="text-end ${closingDebit > 0 ? 'text-success fw-bold' : ''}">
                            ${closingDebit > 0 ? `Rs${closingDebit.toFixed(2)}` : '-'}
                        </td>
                        <td class="text-end ${closingCredit > 0 ? 'text-danger fw-bold' : ''}">
                            ${closingCredit > 0 ? `Rs${closingCredit.toFixed(2)}` : '-'}
                        </td>
                    </tr>
                `;
                });

                // Type totals
                reportHtml += `
                <tr class="table-active">
                    <td colspan="3" class="fw-bold text-end">${type.toUpperCase()} TOTAL</td>
                    <td class="text-end fw-bold">${typeDebit > 0 ? `Rs${typeDebit.toFixed(2)}` : '-'}</td>
                    <td class="text-end fw-bold">${typeCredit > 0 ? `Rs${typeCredit.toFixed(2)}` : '-'}</td>
                    <td class="text-end fw-bold text-success">${typePeriodDebit > 0 ? `Rs${typePeriodDebit.toFixed(2)}` : '-'}</td>
                    <td class="text-end fw-bold text-danger">${typePeriodCredit > 0 ? `Rs${typePeriodCredit.toFixed(2)}` : '-'}</td>
                    <td class="text-end fw-bold ${typeClosingDebit > 0 ? 'text-success' : ''}">
                        ${typeClosingDebit > 0 ? `Rs${typeClosingDebit.toFixed(2)}` : '-'}
                    </td>
                    <td class="text-end fw-bold ${typeClosingCredit > 0 ? 'text-danger' : ''}">
                        ${typeClosingCredit > 0 ? `Rs${typeClosingCredit.toFixed(2)}` : '-'}
                    </td>
                </tr>
            `;
            }

            // Grand totals
            reportHtml += `
                            </tbody>
                            <tfoot class="table-dark">
                                <tr>
                                    <td colspan="3" class="fw-bold">GRAND TOTAL</td>
                                    <td class="text-end fw-bold">Rs${trailBalance.reduce((sum, item) =>
                sum + (item.opening_type === 'DR' ? item.opening_balance : 0), 0).toFixed(2)}</td>
                                    <td class="text-end fw-bold">Rs${trailBalance.reduce((sum, item) =>
                    sum + (item.opening_type === 'CR' ? Math.abs(item.opening_balance) : 0), 0).toFixed(2)}</td>
                                    <td class="text-end fw-bold text-success">Rs${trailBalance.reduce((sum, item) =>
                        sum + item.period_debit, 0).toFixed(2)}</td>
                                    <td class="text-end fw-bold text-danger">Rs${trailBalance.reduce((sum, item) =>
                            sum + item.period_credit, 0).toFixed(2)}</td>
                                    <td class="text-end fw-bold text-success">Rs${totalDebit.toFixed(2)}</td>
                                    <td class="text-end fw-bold text-danger">Rs${totalCredit.toFixed(2)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <!-- Balance Check -->
                    <div class="alert ${totalDebit === totalCredit ? 'alert-success' : 'alert-danger'} mt-4">
                        <h6>Balance Check:</h6>
                        <div class="row">
                            <div class="col-md-6">
                                <p>Total Debit: <strong>Rs${totalDebit.toFixed(2)}</strong></p>
                                <p>Total Credit: <strong>Rs${totalCredit.toFixed(2)}</strong></p>
                            </div>
                            <div class="col-md-6">
                                <p>Difference: <strong>Rs${Math.abs(totalDebit - totalCredit).toFixed(2)}</strong></p>
                                <p>Status: <strong>${totalDebit === totalCredit ? '✅ BALANCED' : '❌ UNBALANCED'}</strong></p>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <small class="text-muted">
                        Generated on ${new Date().toLocaleString()} | 
                        Total Accounts: ${trailBalance.length} | 
                        Balanced: ${totalDebit === totalCredit ? 'Yes' : 'No'}
                    </small>
                </div>
            </div>
        `;

            document.getElementById('reportOutput').innerHTML = reportHtml;
            app.showLoading(false);

        } catch (error) {
            console.error('Error generating trail balance:', error);
            app.showToast('Error generating report', 'danger');
            app.showLoading(false);
        }
    },

    // Add these helper methods
    printLedger() {
        window.print();
    },

    exportLedger() {
        // Simple export functionality
        const accountSelect = document.getElementById('ledgerAccount');
        const selectedOption = accountSelect.selectedOptions[0];
        const accountName = selectedOption ? selectedOption.textContent : 'Unknown Account';

        let csv = 'Date,Voucher No,Type,Narration,Contra Account,Debit,Credit,Balance\n';

        // Extract data from table (simplified)
        document.querySelectorAll('#ledgerDataContainer table tbody tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 8) {
                const rowData = [
                    cells[0].textContent,
                    cells[1].textContent,
                    cells[2].textContent,
                    cells[3].textContent,
                    cells[4].textContent,
                    cells[5].textContent.replace('Rs', '').replace('-', '0'),
                    cells[6].textContent.replace('Rs', '').replace('-', '0'),
                    cells[7].textContent.replace('Rs', '').replace('DR', '').replace('CR', '')
                ];
                csv += rowData.map(cell => `"${cell}"`).join(',') + '\n';
            }
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ledger_${accountName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        app.showToast('Ledger exported successfully', 'success');
    },

    exportTrailBalance() {
        let csv = 'Account Code,Account Name,Type,Opening Debit,Opening Credit,Period Debit,Period Credit,Closing Debit,Closing Credit\n';

        // Extract data from table (simplified)
        document.querySelectorAll('.card-body table tbody tr').forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length >= 9) {
                const rowData = [
                    cells[0].textContent,
                    cells[1].textContent,
                    cells[2].textContent,
                    cells[3].textContent.replace('Rs', '').replace('-', '0'),
                    cells[4].textContent.replace('Rs', '').replace('-', '0'),
                    cells[5].textContent.replace('Rs', '').replace('-', '0'),
                    cells[6].textContent.replace('Rs', '').replace('-', '0'),
                    cells[7].textContent.replace('Rs', '').replace('-', '0'),
                    cells[8].textContent.replace('Rs', '').replace('-', '0')
                ];
                csv += rowData.map(cell => `"${cell}"`).join(',') + '\n';
            }
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trail_balance_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        app.showToast('Trail balance exported successfully', 'success');
    },

    async generateStockReport() {
        try {
            app.showLoading(true);

            const lots = await schema.findDocs('lot');
            const products = await schema.findDocs('product');

            const productMap = {};
            products.forEach(p => productMap[p._id] = p);

            // Group by stage
            const stageGroups = {
                'gray': [],
                'dying': [],
                'packing': [],
                'sale': []
            };

            lots.forEach(lot => {
                if (lot.status === 'active' && stageGroups[lot.current_stage]) {
                    stageGroups[lot.current_stage].push(lot);
                }
            });

            let reportHtml = `
                <h5 class="mb-4">Stock Report as of ${new Date().toLocaleDateString()}</h5>
            `;

            // Generate report for each stage
            for (const [stage, stageLots] of Object.entries(stageGroups)) {
                if (stageLots.length > 0) {
                    const totalQty = stageLots.reduce((sum, lot) => sum + (lot.current_qty || 0), 0);
                    const totalCost = stageLots.reduce((sum, lot) => sum + (lot.total_cost || 0), 0);

                    reportHtml += `
                        <div class="mb-4">
                            <h6 class="d-flex justify-content-between align-items-center">
                                <span>
                                    <span class="lot-tag ${stage}-stage me-2">${stage.toUpperCase()}</span>
                                    Stage Stock
                                </span>
                                <span class="badge bg-primary">${stageLots.length} lots, ${totalQty.toFixed(2)} units</span>
                            </h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Lot #</th>
                                            <th>Product</th>
                                            <th>Quantity</th>
                                            <th>UOM</th>
                                            <th>Cost</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${stageLots.map(lot => {
                        const product = productMap[lot.current_product_id];
                        return `
                                                <tr>
                                                    <td>${lot.lot_number}</td>
                                                    <td>${product?.product_name || 'N/A'}</td>
                                                    <td>${lot.current_qty}</td>
                                                    <td>${lot.uom}</td>
                                                    <td>Rs${lot.total_cost?.toFixed(2) || '0.00'}</td>
                                                    <td><span class="badge ${lot.status === 'active' ? 'bg-success' : 'bg-secondary'}">${lot.status}</span></td>
                                                </tr>
                                            `;
                    }).join('')}
                                    </tbody>
                                    <tfoot>
                                        <tr class="table-active">
                                            <th colspan="2">Total</th>
                                            <th>${totalQty.toFixed(2)}</th>
                                            <th></th>
                                            <th>Rs${totalCost.toFixed(2)}</th>
                                            <th></th>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    `;
                }
            }

            // Summary
            const totalLots = lots.filter(l => l.status === 'active').length;
            const totalStockQty = lots.reduce((sum, lot) => sum + (lot.current_qty || 0), 0);
            const totalStockCost = lots.reduce((sum, lot) => sum + (lot.total_cost || 0), 0);

            reportHtml += `
                <div class="alert alert-info mt-4">
                    <h6>Summary</h6>
                    <div class="row">
                        <div class="col-md-3">
                            <strong>Total Active Lots:</strong> ${totalLots}
                        </div>
                        <div class="col-md-3">
                            <strong>Total Quantity:</strong> ${totalStockQty.toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Total Cost:</strong> Rs${totalStockCost.toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Avg Cost/Unit:</strong> Rs${(totalStockCost / totalStockQty).toFixed(2)}
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('reportOutput').innerHTML = reportHtml;
            app.showLoading(false);

        } catch (error) {
            console.error('Error generating stock report:', error);
            app.showToast('Error generating report', 'danger');
            app.showLoading(false);
        }
    },

    async generateProfitLoss() {
        try {
            app.showLoading(true);

            const sales = await schema.findDocs('sale');
            const dateFrom = document.getElementById('reportDateFrom').value;
            const dateTo = document.getElementById('reportDateTo').value;

            // Filter sales by date
            let filteredSales = sales;
            if (dateFrom && dateTo) {
                filteredSales = sales.filter(sale => {
                    const saleDate = new Date(sale.sale_date);
                    const fromDate = new Date(dateFrom);
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    return saleDate >= fromDate && saleDate <= toDate;
                });
            }

            // Calculate totals
            let totalSales = 0;
            let totalCost = 0;
            let totalProfit = 0;

            filteredSales.forEach(sale => {
                if (sale.sale_items) {
                    sale.sale_items.forEach(item => {
                        totalSales += item.sale_price || 0;
                        totalCost += item.final_cost || 0;
                        totalProfit += item.profit || 0;
                    });
                }
            });

            // Get expenses (simplified - from voucher entries)
            const voucherEntries = await schema.findDocs('voucher_entry');
            const expenses = voucherEntries.filter(entry =>
                entry.debit > 0 && // Assuming expenses are debit entries
                (!dateFrom || new Date(entry.created_at) >= new Date(dateFrom)) &&
                (!dateTo || new Date(entry.created_at) <= new Date(dateTo))
            ).reduce((sum, entry) => sum + entry.debit, 0);

            const netProfit = totalProfit - expenses;

            const reportHtml = `
                <h5 class="mb-4">Profit & Loss Statement</h5>
                <p class="text-muted">Period: ${dateFrom} to ${dateTo}</p>
                
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Description</th>
                                <th>Amount (Rs)</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><strong>Total Sales</strong></td>
                                <td class="text-success">${totalSales.toFixed(2)}</td>
                                <td>100.0%</td>
                            </tr>
                            <tr>
                                <td>&nbsp;&nbsp;Cost of Goods Sold</td>
                                <td class="text-danger">${totalCost.toFixed(2)}</td>
                                <td>${((totalCost / totalSales) * 100).toFixed(1)}%</td>
                            </tr>
                            <tr class="table-active">
                                <td><strong>Gross Profit</strong></td>
                                <td class="${totalProfit >= 0 ? 'text-success' : 'text-danger'}">${totalProfit.toFixed(2)}</td>
                                <td>${((totalProfit / totalSales) * 100).toFixed(1)}%</td>
                            </tr>
                            
                            <tr>
                                <td><strong>Operating Expenses</strong></td>
                                <td class="text-danger">${expenses.toFixed(2)}</td>
                                <td>${((expenses / totalSales) * 100).toFixed(1)}%</td>
                            </tr>
                            
                            <tr class="table-${netProfit >= 0 ? 'success' : 'danger'}">
                                <td><strong>Net Profit/Loss</strong></td>
                                <td class="${netProfit >= 0 ? 'text-success' : 'text-danger'}">${netProfit.toFixed(2)}</td>
                                <td>${((netProfit / totalSales) * 100).toFixed(1)}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <h6>Key Metrics</h6>
                        <div class="list-group">
                            <div class="list-group-item d-flex justify-content-between">
                                <span>Gross Margin</span>
                                <span class="fw-bold">${((totalProfit / totalSales) * 100).toFixed(1)}%</span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between">
                                <span>Net Margin</span>
                                <span class="fw-bold">${((netProfit / totalSales) * 100).toFixed(1)}%</span>
                            </div>
                            <div class="list-group-item d-flex justify-content-between">
                                <span>Number of Sales</span>
                                <span class="fw-bold">${filteredSales.length}</span>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <h6>Chart</h6>
                        <canvas id="profitChart" width="400" height="200"></canvas>
                    </div>
                </div>
            `;

            document.getElementById('reportOutput').innerHTML = reportHtml;

            // Create chart if Chart.js is available
            if (typeof Chart !== 'undefined') {
                const ctx = document.getElementById('profitChart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ['Sales', 'Cost', 'Gross Profit', 'Expenses', 'Net Profit'],
                        datasets: [{
                            label: 'Amount (Rs)',
                            data: [totalSales, totalCost, totalProfit, expenses, netProfit],
                            backgroundColor: [
                                '#2ecc71', // Sales - green
                                '#e74c3c', // Cost - red
                                '#3498db', // Gross Profit - blue
                                '#f39c12', // Expenses - orange
                                netProfit >= 0 ? '#27ae60' : '#c0392b' // Net Profit - green/red
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function (value) {
                                        return 'Rs' + value.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
            }

            app.showLoading(false);

        } catch (error) {
            console.error('Error generating profit loss:', error);
            app.showToast('Error generating report', 'danger');
            app.showLoading(false);
        }
    },

    async generateVoucherReport() {
        try {
            app.showLoading(true);

            const vouchers = await schema.findDocs('voucher');
            const voucherEntries = await schema.findDocs('voucher_entry');
            const accounts = await schema.findDocs('account');

            const dateFrom = document.getElementById('reportDateFrom').value;
            const dateTo = document.getElementById('reportDateTo').value;

            // Filter vouchers by date
            let filteredVouchers = vouchers;
            if (dateFrom && dateTo) {
                filteredVouchers = vouchers.filter(voucher => {
                    const voucherDate = new Date(voucher.voucher_date);
                    const fromDate = new Date(dateFrom);
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    return voucherDate >= fromDate && voucherDate <= toDate;
                });
            }

            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);

            // Group by voucher type
            const typeGroups = {};
            filteredVouchers.forEach(voucher => {
                if (!typeGroups[voucher.voucher_type]) {
                    typeGroups[voucher.voucher_type] = [];
                }
                typeGroups[voucher.voucher_type].push(voucher);
            });

            let reportHtml = `
                <h5 class="mb-4">Voucher Transaction Report</h5>
                <p class="text-muted">Period: ${dateFrom} to ${dateTo}</p>
            `;

            // Summary by type
            reportHtml += `
                <div class="row mb-4">
            `;

            Object.entries(typeGroups).forEach(([type, typeVouchers]) => {
                const totalAmount = typeVouchers.reduce((sum, v) => sum + (v.total_amount || 0), 0);
                reportHtml += `
                    <div class="col-md-2 mb-2">
                        <div class="card text-center">
                            <div class="card-body p-2">
                                <h6 class="mb-1">${type}</h6>
                                <div class="text-muted small">${typeVouchers.length} vouchers</div>
                                <div class="fw-bold">Rs${totalAmount.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                `;
            });

            reportHtml += `</div>`;

            // Detailed voucher list
            reportHtml += `
                <h6>Voucher Details</h6>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Voucher #</th>
                                <th>Type</th>
                                <th>Narration</th>
                                <th>Debit</th>
                                <th>Credit</th>
                                <th>Created By</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredVouchers.map(voucher => `
                                <tr>
                                    <td>${new Date(voucher.voucher_date).toLocaleDateString()}</td>
                                    <td>${voucher.voucher_number}</td>
                                    <td><span class="badge ${this.getVoucherTypeBadge(voucher.voucher_type)}">${voucher.voucher_type}</span></td>
                                    <td>${voucher.narration || '-'}</td>
                                    <td class="text-success">Rs${voucher.total_debit?.toFixed(2) || '0.00'}</td>
                                    <td class="text-danger">Rs${voucher.total_credit?.toFixed(2) || '0.00'}</td>
                                    <td>${voucher.created_by || 'System'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="table-active">
                                <th colspan="4">Total</th>
                                <th class="text-success">Rs${filteredVouchers.reduce((sum, v) => sum + (v.total_debit || 0), 0).toFixed(2)}</th>
                                <th class="text-danger">Rs${filteredVouchers.reduce((sum, v) => sum + (v.total_credit || 0), 0).toFixed(2)}</th>
                                <th></th>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            `;

            document.getElementById('reportOutput').innerHTML = reportHtml;
            app.showLoading(false);

        } catch (error) {
            console.error('Error generating voucher report:', error);
            app.showToast('Error generating report', 'danger');
            app.showLoading(false);
        }
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

    async generateLotTraceability() {
        try {
            app.showLoading(true);

            const lots = await schema.findDocs('lot');
            const stockMovements = await schema.findDocs('stock_movement');
            const products = await schema.findDocs('product');

            const productMap = {};
            products.forEach(p => productMap[p._id] = p);

            let reportHtml = `
                <h5 class="mb-4">Lot Traceability Report</h5>
                <p class="text-muted">Complete journey of each lot through all stages</p>
            `;

            // Generate traceability for each lot
            for (const lot of lots) {
                const lotMovements = stockMovements
                    .filter(m => m.lot_id === lot._id)
                    .sort((a, b) => new Date(a.movement_date) - new Date(b.movement_date));

                if (lotMovements.length > 0) {
                    const product = productMap[lot.current_product_id];

                    reportHtml += `
                        <div class="card mb-3">
                            <div class="card-header">
                                <h6 class="mb-0">
                                    ${lot.lot_number} - ${product?.product_name || 'Unknown Product'}
                                    <span class="badge bg-primary float-end">${lot.current_qty} ${lot.uom}</span>
                                </h6>
                            </div>
                            <div class="card-body">
                                <div class="timeline">
                    `;

                    lotMovements.forEach((movement, index) => {
                        const productBefore = productMap[movement.product_before];
                        const productAfter = productMap[movement.product_after];

                        reportHtml += `
                            <div class="d-flex mb-3">
                                <div class="flex-shrink-0">
                                    <div class="timeline-icon bg-${index === lotMovements.length - 1 ? 'success' : 'primary'}">
                                        ${index + 1}
                                    </div>
                                </div>
                                <div class="flex-grow-1 ms-3">
                                    <h6 class="mt-0">
                                        ${movement.from_stage} → ${movement.to_stage}
                                        <small class="text-muted float-end">
                                            ${new Date(movement.movement_date).toLocaleString()}
                                        </small>
                                    </h6>
                                    <p class="mb-1">
                                        <strong>Quantity:</strong> ${movement.qty} ${movement.uom}<br>
                                        <strong>Product:</strong> ${productBefore?.product_name || 'N/A'} → ${productAfter?.product_name || 'N/A'}<br>
                                        <strong>Reference:</strong> ${movement.reference_type} ${movement.reference_id ? '(' + movement.reference_id.substr(-6) + ')' : ''}<br>
                                        <strong>Remarks:</strong> ${movement.remarks || '-'}
                                    </p>
                                </div>
                            </div>
                        `;
                    });

                    reportHtml += `
                                </div>
                            </div>
                            <div class="card-footer">
                                <small class="text-muted">
                                    Created: ${new Date(lot.created_at).toLocaleDateString()} | 
                                    Status: <span class="badge ${lot.status === 'active' ? 'bg-success' : 'bg-secondary'}">${lot.status}</span> | 
                                    Current Stage: <span class="lot-tag ${lot.current_stage}-stage">${lot.current_stage}</span>
                                </small>
                            </div>
                        </div>
                    `;
                }
            }

            document.getElementById('reportOutput').innerHTML = reportHtml;
            app.showLoading(false);

        } catch (error) {
            console.error('Error generating traceability report:', error);
            app.showToast('Error generating report', 'danger');
            app.showLoading(false);
        }
    },

    async generateCustomReport() {
        const reportType = document.getElementById('reportType').value;

        switch (reportType) {
            case 'stock':
                await this.generateStockReport();
                break;
            case 'sales':
                await this.generateSalesReport();
                break;
            case 'purchase':
                await this.generatePurchaseReport();
                break;
            case 'costing':
                await this.generateCostingReport();
                break;
            case 'profit':
                await this.generateProfitLoss();
                break;
            case 'ledger':
                await this.generateLedgerReport();
                break;
            case 'trail_balance':
                await this.generateTrailBalanceReport();
                break;
            case 'voucher':
                await this.generateVoucherReport();
                break;
            default:
                app.showToast('Please select a valid report type', 'warning');
        }
    },

    async generateSalesReport() {
        try {
            app.showLoading(true);

            const sales = await schema.findDocs('sale');
            const accounts = await schema.findDocs('account');

            const dateFrom = document.getElementById('reportDateFrom').value;
            const dateTo = document.getElementById('reportDateTo').value;

            // Filter sales by date
            let filteredSales = sales;
            if (dateFrom && dateTo) {
                filteredSales = sales.filter(sale => {
                    const saleDate = new Date(sale.sale_date);
                    const fromDate = new Date(dateFrom);
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    return saleDate >= fromDate && saleDate <= toDate;
                });
            }

            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);

            // Group by buyer
            const buyerGroups = {};
            filteredSales.forEach(sale => {
                const buyerId = sale.buyer_account_id;
                if (!buyerGroups[buyerId]) {
                    buyerGroups[buyerId] = [];
                }
                buyerGroups[buyerId].push(sale);
            });

            let reportHtml = `
                <h5 class="mb-4">Sales Report</h5>
                <p class="text-muted">Period: ${dateFrom} to ${dateTo}</p>
                
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Buyer</th>
                                <th>Invoices</th>
                                <th>Quantity</th>
                                <th>Total Sales</th>
                                <th>Total Profit</th>
                                <th>Avg Margin</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            let grandTotalSales = 0;
            let grandTotalProfit = 0;

            for (const [buyerId, buyerSales] of Object.entries(buyerGroups)) {
                const buyer = accountMap[buyerId];
                let buyerTotalSales = 0;
                let buyerTotalProfit = 0;
                let buyerTotalQty = 0;

                buyerSales.forEach(sale => {
                    buyerTotalSales += sale.total_amount || 0;
                    if (sale.sale_items) {
                        sale.sale_items.forEach(item => {
                            buyerTotalProfit += item.profit || 0;
                            buyerTotalQty += item.qty || 0;
                        });
                    }
                });

                const avgMargin = buyerTotalSales > 0 ? (buyerTotalProfit / buyerTotalSales) * 100 : 0;

                reportHtml += `
                    <tr>
                        <td>${buyer?.account_name || 'Unknown Buyer'}</td>
                        <td>${buyerSales.length}</td>
                        <td>${buyerTotalQty.toFixed(2)}</td>
                        <td class="text-success">Rs${buyerTotalSales.toFixed(2)}</td>
                        <td class="${buyerTotalProfit >= 0 ? 'text-success' : 'text-danger'}">Rs${buyerTotalProfit.toFixed(2)}</td>
                        <td>${avgMargin.toFixed(1)}%</td>
                    </tr>
                `;

                grandTotalSales += buyerTotalSales;
                grandTotalProfit += buyerTotalProfit;
            }

            const grandAvgMargin = grandTotalSales > 0 ? (grandTotalProfit / grandTotalSales) * 100 : 0;

            reportHtml += `
                            <tr class="table-active">
                                <th>Grand Total</th>
                                <th>${filteredSales.length}</th>
                                <th></th>
                                <th class="text-success">Rs${grandTotalSales.toFixed(2)}</th>
                                <th class="${grandTotalProfit >= 0 ? 'text-success' : 'text-danger'}">Rs${grandTotalProfit.toFixed(2)}</th>
                                <th>${grandAvgMargin.toFixed(1)}%</th>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('reportOutput').innerHTML = reportHtml;
            app.showLoading(false);

        } catch (error) {
            console.error('Error generating sales report:', error);
            app.showToast('Error generating report', 'danger');
            app.showLoading(false);
        }
    },

    async generatePurchaseReport() {
        try {
            app.showLoading(true);

            const purchases = await schema.findDocs('purchase');
            const accounts = await schema.findDocs('account');

            const dateFrom = document.getElementById('reportDateFrom').value;
            const dateTo = document.getElementById('reportDateTo').value;

            // Filter purchases by date
            let filteredPurchases = purchases;
            if (dateFrom && dateTo) {
                filteredPurchases = purchases.filter(purchase => {
                    const purchaseDate = new Date(purchase.purchase_date);
                    const fromDate = new Date(dateFrom);
                    const toDate = new Date(dateTo);
                    toDate.setHours(23, 59, 59, 999);
                    return purchaseDate >= fromDate && purchaseDate <= toDate;
                });
            }

            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);

            let reportHtml = `
                <h5 class="mb-4">Purchase Report</h5>
                <p class="text-muted">Period: ${dateFrom} to ${dateTo}</p>
                
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Purchase #</th>
                                <th>Supplier</th>
                                <th>Date</th>
                                <th>Quantity</th>
                                <th>Amount</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            let grandTotalQty = 0;
            let grandTotalAmount = 0;

            filteredPurchases.forEach(purchase => {
                const supplier = accountMap[purchase.supplier_account_id];

                reportHtml += `
                    <tr>
                        <td>${purchase.purchase_number || 'N/A'}</td>
                        <td>${supplier?.account_name || 'Unknown Supplier'}</td>
                        <td>${new Date(purchase.purchase_date).toLocaleDateString()}</td>
                        <td>${purchase.total_qty || 0} ${purchase.uom || ''}</td>
                        <td class="text-danger">Rs${purchase.total_amount?.toFixed(2) || '0.00'}</td>
                        <td><span class="badge ${this.getPurchaseStatusBadge(purchase.status)}">${purchase.status}</span></td>
                    </tr>
                `;

                grandTotalQty += purchase.total_qty || 0;
                grandTotalAmount += purchase.total_amount || 0;
            });

            reportHtml += `
                            <tr class="table-active">
                                <th colspan="3">Total</th>
                                <th>${grandTotalQty.toFixed(2)}</th>
                                <th class="text-danger">Rs${grandTotalAmount.toFixed(2)}</th>
                                <th></th>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;

            document.getElementById('reportOutput').innerHTML = reportHtml;
            app.showLoading(false);

        } catch (error) {
            console.error('Error generating purchase report:', error);
            app.showToast('Error generating report', 'danger');
            app.showLoading(false);
        }
    },

    getPurchaseStatusBadge(status) {
        const badges = {
            'pending': 'bg-warning',
            'completed': 'bg-success',
            'partial': 'bg-info',
            'rejected': 'bg-danger',
            'cancelled': 'bg-secondary'
        };
        return badges[status] || 'bg-light text-dark';
    },

    async generateCostingReport() {
        try {
            app.showLoading(true);

            const lots = await schema.findDocs('lot');
            const lotCosts = await schema.findDocs('lot_cost');
            const products = await schema.findDocs('product');

            const productMap = {};
            products.forEach(p => productMap[p._id] = p);

            let reportHtml = `
                <h5 class="mb-4">Costing Report</h5>
                <p class="text-muted">Cost breakdown for all active lots</p>
                
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Lot #</th>
                                <th>Product</th>
                                <th>Stage</th>
                                <th>Quantity</th>
                                <th>Purchase Cost</th>
                                <th>Dying Cost</th>
                                <th>Packing Cost</th>
                                <th>Total Cost</th>
                                <th>Cost/Unit</th>
                            </tr>
                        </thead>
                        <tbody>
            `;

            for (const lot of lots) {
                if (lot.status !== 'active') continue;

                const lotCostsForLot = lotCosts.filter(c => c.lot_id === lot._id);

                let purchaseCost = 0;
                let dyingCost = 0;
                let packingCost = 0;

                lotCostsForLot.forEach(cost => {
                    if (cost.cost_type === 'purchase') purchaseCost += cost.total_cost || 0;
                    if (cost.cost_type === 'dying') dyingCost += cost.total_cost || 0;
                    if (cost.cost_type === 'packing') packingCost += cost.total_cost || 0;
                });

                const totalCost = purchaseCost + dyingCost + packingCost;
                const costPerUnit = lot.current_qty > 0 ? totalCost / lot.current_qty : 0;
                const product = productMap[lot.current_product_id];

                reportHtml += `
                    <tr>
                        <td>${lot.lot_number}</td>
                        <td>${product?.product_name || 'N/A'}</td>
                        <td><span class="lot-tag ${lot.current_stage}-stage">${lot.current_stage}</span></td>
                        <td>${lot.current_qty} ${lot.uom}</td>
                        <td>Rs${purchaseCost.toFixed(2)}</td>
                        <td>Rs${dyingCost.toFixed(2)}</td>
                        <td>Rs${packingCost.toFixed(2)}</td>
                        <td class="fw-bold">Rs${totalCost.toFixed(2)}</td>
                        <td class="${costPerUnit > 0 ? 'text-danger' : 'text-muted'}">Rs${costPerUnit.toFixed(2)}/${lot.uom}</td>
                    </tr>
                `;
            }

            reportHtml += `
                        </tbody>
                    </table>
                </div>
                
                <div class="alert alert-info mt-4">
                    <h6>Cost Analysis</h6>
                    <div class="row">
                        <div class="col-md-3">
                            <strong>Average Cost/Unit:</strong> Rs${this.calculateAverageCost(lots, lotCosts).toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Total Inventory Value:</strong> Rs${this.calculateTotalInventoryValue(lots, lotCosts).toFixed(2)}
                        </div>
                        <div class="col-md-3">
                            <strong>Active Lots:</strong> ${lots.filter(l => l.status === 'active').length}
                        </div>
                        <div class="col-md-3">
                            <strong>Total Cost Categories:</strong> ${lotCosts.length}
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('reportOutput').innerHTML = reportHtml;
            app.showLoading(false);

        } catch (error) {
            console.error('Error generating costing report:', error);
            app.showToast('Error generating report', 'danger');
            app.showLoading(false);
        }
    },

    calculateAverageCost(lots, lotCosts) {
        let totalCost = 0;
        let totalQty = 0;

        lots.forEach(lot => {
            if (lot.status === 'active') {
                const lotCostsForLot = lotCosts.filter(c => c.lot_id === lot._id);
                const totalLotCost = lotCostsForLot.reduce((sum, cost) => sum + (cost.total_cost || 0), 0);

                totalCost += totalLotCost;
                totalQty += lot.current_qty || 0;
            }
        });

        return totalQty > 0 ? totalCost / totalQty : 0;
    },

    calculateTotalInventoryValue(lots, lotCosts) {
        let totalValue = 0;

        lots.forEach(lot => {
            if (lot.status === 'active') {
                const lotCostsForLot = lotCosts.filter(c => c.lot_id === lot._id);
                const totalLotCost = lotCostsForLot.reduce((sum, cost) => sum + (cost.total_cost || 0), 0);
                totalValue += totalLotCost;
            }
        });

        return totalValue;
    },

    async exportReport() {
        const reportOutput = document.getElementById('reportOutput');
        const reportType = document.getElementById('reportType').value;

        if (reportOutput.innerText.includes('No report generated yet')) {
            app.showToast('Please generate a report first', 'warning');
            return;
        }

        try {
            // Create a simple CSV export based on the current report
            let csv = '';
            const dateFrom = document.getElementById('reportDateFrom').value;
            const dateTo = document.getElementById('reportDateTo').value;

            switch (reportType) {
                case 'stock':
                    const lots = await schema.findDocs('lot');
                    csv = 'Lot Number,Product,Stage,Quantity,UOM,Cost,Status\n';
                    lots.forEach(lot => {
                        csv += `${lot.lot_number},${lot.current_product_id},${lot.current_stage},${lot.current_qty},${lot.uom},${lot.total_cost || 0},${lot.status}\n`;
                    });
                    break;

                case 'sales':
                    const sales = await schema.findDocs('sale');
                    csv = 'Invoice Number,Buyer,Date,Quantity,Amount,Profit\n';
                    sales.forEach(sale => {
                        const profit = sale.sale_items?.reduce((sum, item) => sum + (item.profit || 0), 0) || 0;
                        csv += `${sale.invoice_number},${sale.buyer_account_id},${sale.sale_date},${sale.total_qty || 0},${sale.total_amount || 0},${profit}\n`;
                    });
                    break;

                default:
                    app.showToast('Export not available for this report type', 'warning');
                    return;
            }

            // Create download link
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${reportType}_report_${dateFrom}_to_${dateTo}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            app.showToast('Report exported successfully', 'success');

        } catch (error) {
            console.error('Error exporting report:', error);
            app.showToast('Error exporting report', 'danger');
        }
    }


};

// Export the module
window.reportsModule = reportsModule;