// Settings Module
const settingsModule = {
    async load() {
        if (!authManager.hasPermission('settings')) {
            document.getElementById('content-area').innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="bi bi-shield-exclamation"></i> Access Denied</h4>
                    <p>You don't have permission to access the Settings module.</p>
                </div>
            `;
            return;
        }
        
        const content = `
            <div class="mb-4">
                <h4><i class="bi bi-gear"></i> System Settings</h4>
                <p class="text-muted">Configure system parameters and preferences</p>
            </div>
            
            <div class="row">
                <div class="col-md-3">
                    <div class="list-group">
                        <a href="#" class="list-group-item list-group-item-action active" onclick="settingsModule.showGeneralSettings()">
                            <i class="bi bi-sliders"></i> General Settings
                        </a>
                        <a href="#" class="list-group-item list-group-item-action" onclick="settingsModule.showProductSettings()">
                            <i class="bi bi-box"></i> Product Setup
                        </a>
                        <a href="#" class="list-group-item list-group-item-action" onclick="settingsModule.showUOMSettings()">
                            <i class="bi bi-ruler"></i> Units of Measure
                        </a>
                        <a href="#" class="list-group-item list-group-item-action" onclick="settingsModule.showAccountSettings()">
                            <i class="bi bi-journal-bookmark"></i> Account Types
                        </a>
                        <a href="#" class="list-group-item list-group-item-action" onclick="settingsModule.showDatabaseSettings()">
                            <i class="bi bi-database"></i> Database Management
                        </a>
                    </div>
                </div>
                
                <div class="col-md-9">
                    <div id="settings-content">
                        <div class="text-center text-muted py-5">
                            <i class="bi bi-gear display-4"></i>
                            <p class="mt-3">Select a settings category from the left menu</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
    },

    async showGeneralSettings() {
        try {
            const content = `
                <div class="card">
                    <div class="card-header">
                        <h5><i class="bi bi-sliders"></i> General Settings</h5>
                    </div>
                    <div class="card-body">
                        <form id="generalSettingsForm" onsubmit="return settingsModule.saveGeneralSettings(event)">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Company Name</label>
                                    <input type="text" class="form-control" id="companyName" 
                                           value="Textile ERP System" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Default Currency</label>
                                    <select class="form-select" id="defaultCurrency">
                                        <option value="INR" selected>Indian Rupee (Rs)</option>
                                        <option value="USD">US Dollar ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Default Lot Number Prefix</label>
                                    <input type="text" class="form-control" id="lotPrefix" 
                                           value="LOT" required>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Default Purchase Prefix</label>
                                    <input type="text" class="form-control" id="purchasePrefix" 
                                           value="PUR" required>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Default Invoice Prefix</label>
                                    <input type="text" class="form-control" id="invoicePrefix" 
                                           value="INV" required>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Default Dying Cost per Meter (Rs)</label>
                                    <input type="number" class="form-control" id="defaultDyingCost" 
                                           value="15.00" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Default Packing Cost per Meter (Rs)</label>
                                    <input type="number" class="form-control" id="defaultPackingCost" 
                                           value="10.00" step="0.01" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Low Stock Threshold</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="lowStockThreshold" 
                                           value="100" step="1" required>
                                    <span class="input-group-text">units</span>
                                </div>
                                <div class="form-text">Alert when stock falls below this level</div>
                            </div>
                            
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="enableAutoSync" checked>
                                <label class="form-check-label" for="enableAutoSync">Enable Auto Sync</label>
                            </div>
                            
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="enableEmailAlerts">
                                <label class="form-check-label" for="enableEmailAlerts">Enable Email Alerts</label>
                            </div>
                            
                            <div class="d-grid">
                                <button type="submit" class="btn btn-primary">
                                    <i class="bi bi-save"></i> Save General Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            
            document.getElementById('settings-content').innerHTML = content;
            
        } catch (error) {
            console.error('Error loading general settings:', error);
        }
    },

    async saveGeneralSettings(event) {
        event.preventDefault();
        
        try {
            const settings = {
                company_name: document.getElementById('companyName').value,
                default_currency: document.getElementById('defaultCurrency').value,
                lot_prefix: document.getElementById('lotPrefix').value,
                purchase_prefix: document.getElementById('purchasePrefix').value,
                invoice_prefix: document.getElementById('invoicePrefix').value,
                default_dying_cost: parseFloat(document.getElementById('defaultDyingCost').value),
                default_packing_cost: parseFloat(document.getElementById('defaultPackingCost').value),
                low_stock_threshold: parseInt(document.getElementById('lowStockThreshold').value),
                enable_auto_sync: document.getElementById('enableAutoSync').checked,
                enable_email_alerts: document.getElementById('enableEmailAlerts').checked,
                updated_at: new Date().toISOString(),
                updated_by: authManager.getCurrentUser().username
            };
            
            // Save to database
            const existingSettings = await schema.findDocs('setting');
            if (existingSettings.length > 0) {
                const setting = existingSettings[0];
                await schema.updateDoc({ ...setting, ...settings });
            } else {
                await schema.createDoc('setting', { type: 'setting', ...settings });
            }
            
            app.showToast('General settings saved successfully!', 'success');
            
        } catch (error) {
            console.error('Error saving general settings:', error);
            app.showToast('Error saving settings: ' + error.message, 'danger');
        }
    },

    async showProductSettings() {
        try {
            const products = await schema.findDocs('product');
            
            let productRows = '';
            products.forEach(product => {
                productRows += `
                    <tr>
                        <td>${product.product_name}</td>
                        <td>${product.category}</td>
                        <td>${product.uom}</td>
                        <td>
                            <span class="badge ${product.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                                ${product.status}
                            </span>
                        </td>
                        <td>
                            <button class="btn btn-sm btn-outline-warning" onclick="settingsModule.editProduct('${product._id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="settingsModule.deleteProduct('${product._id}')">
                                <i class="bi bi-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
            
            const content = `
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5><i class="bi bi-box"></i> Product Management</h5>
                        <button class="btn btn-primary btn-sm" onclick="settingsModule.showProductForm()">
                            <i class="bi bi-plus"></i> Add Product
                        </button>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Product Name</th>
                                        <th>Category</th>
                                        <th>UOM</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productRows}
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="mt-4">
                            <h6>Product Categories</h6>
                            <div class="row">
                                <div class="col-md-3">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <i class="bi bi-droplet text-primary display-6"></i>
                                            <h6>Gray Cloth</h6>
                                            <div class="text-muted">Raw material</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <i class="bi bi-palette text-danger display-6"></i>
                                            <h6>Dyed Cloth</h6>
                                            <div class="text-muted">After dyeing</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <i class="bi bi-box text-warning display-6"></i>
                                            <h6>Packed Goods</h6>
                                            <div class="text-muted">After packing</div>
                                        </div>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="card">
                                        <div class="card-body text-center">
                                            <i class="bi bi-check-circle text-success display-6"></i>
                                            <h6>Finished Goods</h6>
                                            <div class="text-muted">Ready for sale</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('settings-content').innerHTML = content;
            
        } catch (error) {
            console.error('Error loading product settings:', error);
        }
    },

    async showProductForm(productId = null) {
        try {
            let productData = {};
            if (productId) {
                const product = await schema.getDoc(productId);
                productData = product;
            }
            
            const formHtml = `
                <form id="productForm" onsubmit="return settingsModule.saveProduct(event)">
                    ${productId ? `<input type="hidden" id="productId" value="${productId}">` : ''}
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Product Name *</label>
                            <input type="text" class="form-control" id="productName" 
                                   value="${productData.product_name || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Category *</label>
                            <select class="form-select" id="category" required>
                                <option value="">Select Category</option>
                                <option value="gray" ${productData.category === 'gray' ? 'selected' : ''}>Gray Cloth</option>
                                <option value="dyed" ${productData.category === 'dyed' ? 'selected' : ''}>Dyed Cloth</option>
                                <option value="packed" ${productData.category === 'packed' ? 'selected' : ''}>Packed Goods</option>
                                <option value="finished" ${productData.category === 'finished' ? 'selected' : ''}>Finished Goods</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Unit of Measure *</label>
                            <select class="form-select" id="uom" required>
                                <option value="">Select UOM</option>
                                <option value="meter" ${productData.uom === 'meter' ? 'selected' : ''}>Meter</option>
                                <option value="thaan" ${productData.uom === 'thaan' ? 'selected' : ''}>Thaan</option>
                                <option value="bag" ${productData.uom === 'bag' ? 'selected' : ''}>Bag</option>
                                <option value="kg" ${productData.uom === 'kg' ? 'selected' : ''}>KG</option>
                                <option value="piece" ${productData.uom === 'piece' ? 'selected' : ''}>Piece</option>
                            </select>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="status">
                                <option value="active" ${productData.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="inactive" ${productData.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea class="form-control" id="description" rows="2">${productData.description || ''}</textarea>
                    </div>
                    
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary">
                            ${productId ? 'Update' : 'Save'} Product
                        </button>
                    </div>
                </form>
            `;
            
            app.showModal(productId ? 'Edit Product' : 'Add New Product', formHtml);
            
        } catch (error) {
            console.error('Error showing product form:', error);
            app.showToast('Error loading form: ' + error.message, 'danger');
        }
    },

    async saveProduct(event) {
        event.preventDefault();
        
        try {
            const productId = document.getElementById('productId')?.value;
            
            const productData = {
                product_name: document.getElementById('productName').value,
                category: document.getElementById('category').value,
                uom: document.getElementById('uom').value,
                status: document.getElementById('status').value,
                description: document.getElementById('description').value
            };
            
            if (productId) {
                const existing = await schema.getDoc(productId);
                await schema.updateDoc({ ...existing, ...productData });
                app.showToast('Product updated successfully!', 'success');
            } else {
                await schema.createDoc('product', productData);
                app.showToast('Product created successfully!', 'success');
            }
            
            app.hideModal();
            await this.showProductSettings();
            
        } catch (error) {
            console.error('Error saving product:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async editProduct(productId) {
        await this.showProductForm(productId);
    },

    async deleteProduct(productId) {
        try {
            if (confirm('Are you sure you want to delete this product?')) {
                const product = await schema.getDoc(productId);
                product.status = 'inactive';
                await schema.updateDoc(product);
                
                app.showToast('Product marked as inactive', 'success');
                await this.showProductSettings();
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async showUOMSettings() {
        const content = `
            <div class="card">
                <div class="card-header">
                    <h5><i class="bi bi-ruler"></i> Units of Measure</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Available UOMs</h6>
                            <div class="list-group">
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    Meter
                                    <span class="badge bg-primary">Primary unit for cloth</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    Thaan
                                    <span class="badge bg-info">1 Thaan = 35-40 Meters</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    Bag
                                    <span class="badge bg-warning">For packed goods</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    KG
                                    <span class="badge bg-secondary">Weight measurement</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    Piece
                                    <span class="badge bg-success">Count-based</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <h6>Conversion Factors</h6>
                            <div class="alert alert-info">
                                <p><strong>Standard Conversions:</strong></p>
                                <ul class="mb-0">
                                    <li>1 Thaan = 35-40 Meters (depending on fabric)</li>
                                    <li>1 Bag = 50-100 Meters (varies by packing)</li>
                                    <li>1 KG = Varies by fabric density</li>
                                </ul>
                            </div>
                            
                            <form id="uomConversionForm">
                                <div class="mb-3">
                                    <label class="form-label">Add Custom Conversion</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control" placeholder="From value">
                                        <select class="form-select">
                                            <option>Meter</option>
                                            <option>Thaan</option>
                                        </select>
                                        <span class="input-group-text">=</span>
                                        <input type="number" class="form-control" placeholder="To value">
                                        <select class="form-select">
                                            <option>Thaan</option>
                                            <option>Meter</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-outline-primary">Add Conversion</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('settings-content').innerHTML = content;
    },

    async showAccountSettings() {
        const content = `
            <div class="card">
                <div class="card-header">
                    <h5><i class="bi bi-journal-bookmark"></i> Account Types & Hierarchy</h5>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Account Types</h6>
                            <div class="list-group">
                                <div class="list-group-item">
                                    <span class="account-type-badge asset">Asset</span>
                                    <small class="text-muted d-block">Resources owned by the business</small>
                                </div>
                                <div class="list-group-item">
                                    <span class="account-type-badge liability">Liability</span>
                                    <small class="text-muted d-block">Obligations of the business</small>
                                </div>
                                <div class="list-group-item">
                                    <span class="account-type-badge income">Income</span>
                                    <small class="text-muted d-block">Revenue from operations</small>
                                </div>
                                <div class="list-group-item">
                                    <span class="account-type-badge expense">Expense</span>
                                    <small class="text-muted d-block">Costs incurred</small>
                                </div>
                                <div class="list-group-item">
                                    <span class="account-type-badge supplier">Supplier</span>
                                    <small class="text-muted d-block">Vendors and suppliers</small>
                                </div>
                                <div class="list-group-item">
                                    <span class="account-type-badge buyer">Buyer</span>
                                    <small class="text-muted d-block">Customers and buyers</small>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-6">
                            <h6>Account Hierarchy Levels</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Level</th>
                                            <th>Description</th>
                                            <th>Example</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><span class="badge bg-primary">1</span></td>
                                            <td>Main Group</td>
                                            <td>Current Assets</td>
                                        </tr>
                                        <tr>
                                            <td><span class="badge bg-secondary">2</span></td>
                                            <td>Sub Group</td>
                                            <td>Cash & Bank</td>
                                        </tr>
                                        <tr>
                                            <td><span class="badge bg-success">3</span></td>
                                            <td>Ledger</td>
                                            <td>Cash in Hand</td>
                                        </tr>
                                        <tr>
                                            <td><span class="badge bg-info">4</span></td>
                                            <td>Sub Ledger</td>
                                            <td>Main Cash Counter</td>
                                        </tr>
                                        <tr>
                                            <td><span class="badge bg-warning">5</span></td>
                                            <td>Cost Center</td>
                                            <td>Factory Unit 1</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            
                            <div class="alert alert-info">
                                <h6>Rules:</h6>
                                <ul class="mb-0">
                                    <li>Level 1 accounts can have Level 2-5 children</li>
                                    <li>Level 5 accounts cannot have children</li>
                                    <li>Transactions are only posted to Level 3-5 accounts</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('settings-content').innerHTML = content;
    },

    async showDatabaseSettings() {
        const content = `
            <div class="card">
                <div class="card-header">
                    <h5><i class="bi bi-database"></i> Database Management</h5>
                </div>
                <div class="card-body">
                    <div class="alert alert-warning">
                        <i class="bi bi-exclamation-triangle"></i>
                        <strong>Warning:</strong> These operations affect the entire database. Proceed with caution.
                    </div>
                    
                    <div class="row">
                        <div class="col-md-4">
                            <div class="card text-center mb-3">
                                <div class="card-body">
                                    <i class="bi bi-cloud-arrow-up display-4 text-primary mb-3"></i>
                                    <h5>Backup Database</h5>
                                    <p class="text-muted">Create a backup of all data</p>
                                    <button class="btn btn-outline-primary" onclick="settingsModule.backupDatabase()">
                                        <i class="bi bi-download"></i> Backup Now
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="card text-center mb-3">
                                <div class="card-body">
                                    <i class="bi bi-arrow-clockwise display-4 text-success mb-3"></i>
                                    <h5>Sync Status</h5>
                                    <p class="text-muted">Check sync with CouchDB</p>
                                    <div class="mb-2">
                                        <span id="db-sync-status" class="badge bg-secondary">Checking...</span>
                                    </div>
                                    <button class="btn btn-outline-success" onclick="settingsModule.checkSyncStatus()">
                                        <i class="bi bi-arrow-repeat"></i> Check Now
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-md-4">
                            <div class="card text-center mb-3">
                                <div class="card-body">
                                    <i class="bi bi-trash display-4 text-danger mb-3"></i>
                                    <h5>Clear All Data</h5>
                                    <p class="text-muted">Delete all records (Admin only)</p>
                                    <button class="btn btn-outline-danger" onclick="settingsModule.clearDatabase()">
                                        <i class="bi bi-trash"></i> Clear Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4">
                        <h6>Database Statistics</h6>
                        <div id="db-stats">
                            Loading statistics...
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('settings-content').innerHTML = content;
        await this.loadDatabaseStats();
        await this.checkSyncStatus();
    },

    async loadDatabaseStats() {
        try {
            const allDocs = await schema.getAllDocs();
            
            const stats = {
                total_docs: allDocs.length,
                users: allDocs.filter(doc => doc.type === 'user').length,
                lots: allDocs.filter(doc => doc.type === 'lot').length,
                products: allDocs.filter(doc => doc.type === 'product').length,
                accounts: allDocs.filter(doc => doc.type === 'account').length,
                vouchers: allDocs.filter(doc => doc.type === 'voucher').length,
                sales: allDocs.filter(doc => doc.type === 'sale').length,
                purchases: allDocs.filter(doc => doc.type === 'purchase').length
            };
            
            const statsHtml = `
                <div class="row">
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center p-2">
                                <h6 class="mb-1">Total Documents</h6>
                                <h4 class="text-primary">${stats.total_docs}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center p-2">
                                <h6 class="mb-1">Users</h6>
                                <h4 class="text-success">${stats.users}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center p-2">
                                <h6 class="mb-1">Lots</h6>
                                <h4 class="text-warning">${stats.lots}</h4>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card">
                            <div class="card-body text-center p-2">
                                <h6 class="mb-1">Accounts</h6>
                                <h4 class="text-info">${stats.accounts}</h4>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-3">
                    <table class="table table-sm">
                        <tr>
                            <td>Database Name:</td>
                            <td><code>${DB_NAME}</code></td>
                        </tr>
                        <tr>
                            <td>Last Updated:</td>
                            <td>${new Date().toLocaleString()}</td>
                        </tr>
                        <tr>
                            <td>Storage Used:</td>
                            <td>Calculating...</td>
                        </tr>
                    </table>
                </div>
            `;
            
            document.getElementById('db-stats').innerHTML = statsHtml;
            
        } catch (error) {
            console.error('Error loading database stats:', error);
            document.getElementById('db-stats').innerHTML = 'Error loading statistics';
        }
    },

    async checkSyncStatus() {
        try {
            const syncStatus = syncManager.syncStatus;
            const statusElement = document.getElementById('db-sync-status');
            
            statusElement.textContent = syncStatus;
            statusElement.className = `badge bg-${syncManager.getStatusColor(syncStatus)}`;
            
        } catch (error) {
            console.error('Error checking sync status:', error);
        }
    },

    async backupDatabase() {
        try {
            const allDocs = await schema.getAllDocs();
            const backupData = {
                timestamp: new Date().toISOString(),
                database: DB_NAME,
                count: allDocs.length,
                documents: allDocs
            };
            
            const jsonStr = JSON.stringify(backupData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `textile_erp_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            app.showToast('Database backup downloaded successfully', 'success');
            
        } catch (error) {
            console.error('Error backing up database:', error);
            app.showToast('Error creating backup', 'danger');
        }
    },

    async clearDatabase() {
        try {
            if (authManager.getCurrentUser().role !== 'admin') {
                app.showToast('Only administrators can clear the database', 'danger');
                return;
            }
            
            if (confirm('WARNING: This will delete ALL data including users, lots, accounts, and transactions. This action cannot be undone. Are you absolutely sure?')) {
                if (confirm('Type "DELETE" to confirm deletion:')) {
                    const confirmation = prompt('Please type DELETE to confirm:');
                    if (confirmation === 'DELETE') {
                        app.showLoading(true);
                        await schema.clearDatabase();
                        app.showLoading(false);
                        app.showToast('Database cleared successfully', 'success');
                        setTimeout(() => location.reload(), 2000);
                    }
                }
            }
        } catch (error) {
            console.error('Error clearing database:', error);
            app.showToast('Error clearing database', 'danger');
            app.showLoading(false);
        }
    }
};

// Export the module
window.settingsModule = settingsModule;