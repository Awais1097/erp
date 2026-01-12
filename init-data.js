// init-data.js
async function initializeSampleData() {
    // Check if data already exists
    const existingAccounts = await schema.findDocs('account');
    if (existingAccounts.length > 0) {
        console.log('Data already initialized');
        return;
    }
    
    console.log('Initializing sample data...');
    
    // Create sample accounts
    const accounts = [
        { account_name: 'Cash in Hand', account_type: 'asset', opening_balance: 100000, opening_type: 'DR' },
        { account_name: 'Bank Account', account_type: 'asset', opening_balance: 500000, opening_type: 'DR' },
        { account_name: 'Gray Cloth Suppliers', account_type: 'supplier', opening_balance: 0, opening_type: 'CR' },
        { account_name: 'Dying Party - ABC', account_type: 'dying_party', opening_balance: 0, opening_type: 'CR' },
        { account_name: 'Packing Party - XYZ', account_type: 'packing_party', opening_balance: 0, opening_type: 'CR' },
        { account_name: 'Buyer - Textile Corp', account_type: 'buyer', opening_balance: 0, opening_type: 'DR' },
        { account_name: 'Sales Account', account_type: 'income', opening_balance: 0, opening_type: 'CR' },
        { account_name: 'Purchase Account', account_type: 'expense', opening_balance: 0, opening_type: 'DR' },
        { account_name: 'Dying Expenses', account_type: 'expense', opening_balance: 0, opening_type: 'DR' },
        { account_name: 'Packing Expenses', account_type: 'expense', opening_balance: 0, opening_type: 'DR' }
    ];
    
    for (const account of accounts) {
        await schema.createDoc('account', account);
    }
    
    // Create sample products
    const products = [
        { product_name: 'Cotton Gray Cloth', category: 'gray', uom: 'meter' },
        { product_name: 'Polyester Gray Cloth', category: 'gray', uom: 'meter' },
        { product_name: 'Dyed Cotton', category: 'dyed', uom: 'meter' },
        { product_name: 'Printed Cotton', category: 'finished', uom: 'meter' },
        { product_name: 'Packed Bedsheet', category: 'packed', uom: 'bag' }
    ];
    
    for (const product of products) {
        await schema.createDoc('product', product);
    }
    
    console.log('Sample data initialized successfully');
}

// Run initialization when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSampleData);