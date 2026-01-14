// Login Module
const loginModule = {
    async load() {
        // This module doesn't have a separate UI
        // It's handled by the main app
        console.log('Login module loaded');
        
        // Check if we need to show setup
        const users = await schema.findDocs('user');
        if (users.length === 0) {
            this.showSetupScreen();
        }
    },

    async showSetupScreen() {
        const loginContainer = document.getElementById('login-container');
        if (!loginContainer) return;
        
        loginContainer.innerHTML = `
            <div class="login-card">
                <div class="text-center mb-4">
                    <i class="bi bi-gear-fill login-icon text-primary"></i>
                    <h3 class="login-title">Textile ERP Setup</h3>
                    <p class="text-muted">Welcome! Let's set up your system.</p>
                </div>
                
                <div class="alert alert-info">
                    <i class="bi bi-info-circle"></i>
                    No users found in the database. Setting up initial configuration...
                </div>
                
                <form id="setupForm">
                    <h5 class="mb-3">Admin User Setup</h5>
                    
                    <div class="mb-3">
                        <label class="form-label">Full Name *</label>
                        <input type="text" class="form-control" id="adminName" value="Administrator" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Username *</label>
                        <input type="text" class="form-control" id="adminUsername" value="admin" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Email</label>
                        <input type="email" class="form-control" id="adminEmail" value="admin@textileerp.com">
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Password *</label>
                        <input type="password" class="form-control" id="adminPassword" value="admin123" required>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Confirm Password *</label>
                        <input type="password" class="form-control" id="adminConfirmPassword" value="admin123" required>
                    </div>
                    
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-gear"></i> Setup System
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('setupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('adminPassword').value;
            const confirmPassword = document.getElementById('adminConfirmPassword').value;
            
            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }
            
            try {
                // Create admin user
                await authManager.register({
                    username: document.getElementById('adminUsername').value,
                    password: password,
                    name: document.getElementById('adminName').value,
                    email: document.getElementById('adminEmail').value,
                    role: 'admin',
                    created_by: 'setup'
                });
                
                // Create sample data
                await this.createSampleData();
                
                alert('Setup completed successfully! You can now login.');
                location.reload();
                
            } catch (error) {
                alert('Setup error: ' + error.message);
            }
        });
    },

    async createSampleData() {
        try {
            // Create sample products
            const products = [
                {
                    type: 'product',
                    product_name: 'Cotton Gray Cloth',
                    category: 'gray',
                    uom: 'meter',
                    status: 'active'
                },
                {
                    type: 'product',
                    product_name: 'Polyester Gray Cloth',
                    category: 'gray',
                    uom: 'meter',
                    status: 'active'
                },
                {
                    type: 'product',
                    product_name: 'Dyed Cotton Fabric',
                    category: 'dyed',
                    uom: 'meter',
                    status: 'active'
                }
            ];
            
            for (const product of products) {
                await schema.createDoc('product', product);
            }
            
            // Create sample accounts
            const accounts = [
                {
                    type: 'account',
                    account_name: 'Cash in Hand',
                    account_type: 'asset',
                    account_code: 'ACC-001',
                    opening_balance: 100000,
                    opening_type: 'DR',
                    level: 1,
                    status: 'active'
                },
                {
                    type: 'account',
                    account_name: 'Bank Account',
                    account_type: 'asset',
                    account_code: 'ACC-002',
                    opening_balance: 500000,
                    opening_type: 'DR',
                    level: 1,
                    status: 'active'
                },
                {
                    type: 'account',
                    account_name: 'Gray Cloth Suppliers',
                    account_type: 'supplier',
                    account_code: 'ACC-003',
                    opening_balance: 0,
                    opening_type: 'CR',
                    level: 1,
                    status: 'active'
                }
            ];
            
            for (const account of accounts) {
                await schema.createDoc('account', account);
            }
            
            console.log('Sample data created successfully');
            
        } catch (error) {
            console.error('Error creating sample data:', error);
        }
    }
};

// Export the module
window.loginModule = loginModule;