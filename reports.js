// reports.js
class ReportsModule {
    static async generateTrialBalance(startDate, endDate) {
        const vouchers = await schema.findDocs('voucher');
        const entries = await schema.findDocs('voucher_entry');
        const accounts = await schema.findDocs('account');
        
        const filteredVouchers = vouchers.filter(v => {
            const voucherDate = new Date(v.voucher_date);
            return voucherDate >= new Date(startDate) && voucherDate <= new Date(endDate);
        });
        
        const trialBalance = {};
        
        accounts.forEach(account => {
            trialBalance[account._id] = {
                name: account.account_name,
                type: account.account_type,
                opening: account.opening_balance || 0,
                openingType: account.opening_type || 'DR',
                debit: 0,
                credit: 0
            };
        });
        
        filteredVouchers.forEach(voucher => {
            const voucherEntries = entries.filter(e => e.voucher_id === voucher._id);
            
            voucherEntries.forEach(entry => {
                if (trialBalance[entry.account_id]) {
                    trialBalance[entry.account_id].debit += entry.debit || 0;
                    trialBalance[entry.account_id].credit += entry.credit || 0;
                }
            });
        });
        
        return trialBalance;
    }
    
    static async generateBalanceSheet() {
        const accounts = await schema.findDocs('account');
        const vouchers = await schema.findDocs('voucher');
        const entries = await schema.findDocs('voucher_entry');
        
        const balances = {};
        
        // Calculate final balances
        accounts.forEach(account => {
            let balance = account.opening_balance || 0;
            let isDebit = account.opening_type === 'DR';
            
            // Find all entries for this account
            entries.forEach(entry => {
                if (entry.account_id === account._id) {
                    if (entry.debit) {
                        balance += entry.debit;
                        isDebit = true;
                    }
                    if (entry.credit) {
                        balance -= entry.credit;
                        if (balance < 0) {
                            isDebit = false;
                            balance = Math.abs(balance);
                        }
                    }
                }
            });
            
            balances[account._id] = {
                name: account.account_name,
                type: account.account_type,
                balance: balance,
                isDebit: isDebit
            };
        });
        
        // Group by account type
        const assets = [];
        const liabilities = [];
        const equity = [];
        
        Object.values(balances).forEach(acc => {
            if (['asset', 'expense'].includes(acc.type)) {
                assets.push(acc);
            } else if (['liability', 'income'].includes(acc.type)) {
                liabilities.push(acc);
            }
        });
        
        const totalAssets = assets.reduce((sum, a) => sum + (a.isDebit ? a.balance : -a.balance), 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + (l.isDebit ? -l.balance : l.balance), 0);
        const equityBalance = totalAssets - totalLiabilities;
        
        return {
            assets,
            liabilities,
            equity: equityBalance,
            totalAssets,
            totalLiabilities: totalLiabilities + equityBalance
        };
    }
}