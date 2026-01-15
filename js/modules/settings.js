
// Settings Module with Sync Management
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
                    <div class="list-group" id="settings-menu">
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
                        <a href="#" class="list-group-item list-group-item-action" onclick="settingsModule.showSyncSettings()">
                            <i class="bi bi-cloud-arrow-up"></i> Sync & Backup
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

    // Helper method to update active menu item
    updateMenuActive(itemText) {
        const menuItems = document.querySelectorAll('#settings-menu .list-group-item');
        menuItems.forEach(item => {
            item.classList.remove('active');
            if (item.textContent.includes(itemText)) {
                item.classList.add('active');
            }
        });
    },

    // GENERAL SETTINGS
    async showGeneralSettings() {
        try {
            this.updateMenuActive('General');

            // Load existing settings
            const existingSettings = await schema.findDocs('setting');
            let settings = {};
            if (existingSettings.length > 0) {
                settings = existingSettings[0];
            }

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
                                           value="${settings.company_name || 'Textile ERP System'}" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Default Currency</label>
                                    <select class="form-select" id="defaultCurrency">
                                        <option value="INR" ${(settings.default_currency || 'INR') === 'INR' ? 'selected' : ''}>Indian Rupee (Rs)</option>
                                        <option value="USD" ${settings.default_currency === 'USD' ? 'selected' : ''}>US Dollar ($)</option>
                                        <option value="EUR" ${settings.default_currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Default Lot Number Prefix</label>
                                    <input type="text" class="form-control" id="lotPrefix" 
                                           value="${settings.lot_prefix || 'LOT'}" required>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Default Purchase Prefix</label>
                                    <input type="text" class="form-control" id="purchasePrefix" 
                                           value="${settings.purchase_prefix || 'PUR'}" required>
                                </div>
                                <div class="col-md-4 mb-3">
                                    <label class="form-label">Default Invoice Prefix</label>
                                    <input type="text" class="form-control" id="invoicePrefix" 
                                           value="${settings.invoice_prefix || 'INV'}" required>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Default Dying Cost per Meter (Rs)</label>
                                    <input type="number" class="form-control" id="defaultDyingCost" 
                                           value="${settings.default_dying_cost || '15.00'}" step="0.01" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label class="form-label">Default Packing Cost per Meter (Rs)</label>
                                    <input type="number" class="form-control" id="defaultPackingCost" 
                                           value="${settings.default_packing_cost || '10.00'}" step="0.01" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label class="form-label">Low Stock Threshold</label>
                                <div class="input-group">
                                    <input type="number" class="form-control" id="lowStockThreshold" 
                                           value="${settings.low_stock_threshold || '100'}" step="1" required>
                                    <span class="input-group-text">units</span>
                                </div>
                                <div class="form-text">Alert when stock falls below this level</div>
                            </div>
                            
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="enableAutoSync" 
                                       ${(settings.enable_auto_sync !== false) ? 'checked' : ''}>
                                <label class="form-check-label" for="enableAutoSync">Enable Auto Sync</label>
                            </div>
                            
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="enableEmailAlerts"
                                       ${settings.enable_email_alerts ? 'checked' : ''}>
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
            app.showToast('Error loading settings: ' + error.message, 'danger');
        }
    },

    async saveGeneralSettings(event) {
        event.preventDefault();

        try {
            const settings = {
                type: 'setting',
                setting_type: 'general',
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

            // Save to localStorage for sync manager
            localStorage.setItem('enableAutoSync', settings.enable_auto_sync.toString());

            // Save to database
            const existingSettings = await schema.queryView('settings_by_type', { key: 'general' });
            if (existingSettings.length > 0) {
                const setting = existingSettings[0];
                await schema.updateDoc({ ...setting, ...settings });
            } else {
                await schema.createDoc('setting', settings);
            }

            app.showToast('General settings saved successfully!', 'success');

            // Update sync manager if auto-sync changed
            if (settings.enable_auto_sync) {
                setTimeout(() => syncManager.setupCouchDBSync(), 1000);
            } else {
                syncManager.stopSync();
            }

        } catch (error) {
            console.error('Error saving general settings:', error);
            app.showToast('Error saving settings: ' + error.message, 'danger');
        }
    },

    // PRODUCT SETTINGS
    async showProductSettings() {
        try {
            this.updateMenuActive('Product');

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
                                    ${productRows || '<tr><td colspan="5" class="text-center text-muted py-3">No products found</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('settings-content').innerHTML = content;

        } catch (error) {
            console.error('Error loading product settings:', error);
            app.showToast('Error loading products: ' + error.message, 'danger');
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
                type: 'product',
                product_name: document.getElementById('productName').value,
                category: document.getElementById('category').value,
                uom: document.getElementById('uom').value,
                status: document.getElementById('status').value,
                description: document.getElementById('description').value,
                updated_at: new Date().toISOString()
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

    // UOM SETTINGS
    async showUOMSettings() {
        try {
            this.updateMenuActive('Units');

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
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('settings-content').innerHTML = content;

        } catch (error) {
            console.error('Error loading UOM settings:', error);
            app.showToast('Error loading UOM settings: ' + error.message, 'danger');
        }
    },

    // ACCOUNT SETTINGS
    async showAccountSettings() {
        try {
            this.updateMenuActive('Account');

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
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('settings-content').innerHTML = content;

        } catch (error) {
            console.error('Error loading account settings:', error);
            app.showToast('Error loading account settings: ' + error.message, 'danger');
        }
    },

    // SYNC & BACKUP SETTINGS
    async showSyncSettings() {
        try {
            this.updateMenuActive('Sync');

            // Get current Git configuration
            const gitRepoUrl = localStorage.getItem('gitRepoUrl') || '';
            const gitToken = localStorage.getItem('gitToken') ? '••••••••' : '';
            const backupInterval = localStorage.getItem('backupInterval') || '30';

            const content = `
                <div class="card">
                    <div class="card-header">
                        <h5><i class="bi bi-cloud-arrow-up"></i> Sync & Backup Configuration</h5>
                    </div>
                    <div class="card-body">
                        <!-- Real-time Sync Status -->
                        <div class="alert alert-info" id="sync-status-alert">
                            <div class="d-flex align-items-center">
                                <div class="flex-grow-1">
                                    <h6><i class="bi bi-activity"></i> Live Sync Status</h6>
                                    <div class="d-flex align-items-center gap-3 mt-2">
                                        <div>
                                            Status: <span id="live-sync-status" class="badge bg-secondary">Checking...</span>
                                        </div>
                                        <div id="live-sync-details" class="text-muted"></div>
                                    </div>
                                </div>
                                <div>
                                    <button class="btn btn-sm btn-primary" onclick="syncManager.syncNow()">
                                        <i class="bi bi-arrow-repeat"></i> Sync Now
                                    </button>
                                    <button class="btn btn-sm btn-outline-secondary" onclick="syncManager.stopSync()">
                                        <i class="bi bi-stop"></i> Stop
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card mb-4">
                                    <div class="card-header bg-primary text-white">
                                        <h6 class="mb-0"><i class="bi bi-database"></i> CouchDB Sync</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <label class="form-label">Server URL</label>
                                            <div class="input-group">
                                                <input type="text" class="form-control" id="couchdbUrl" 
                                                       value="${REMOTE_COUCHDB}" readonly>
                                                <button class="btn btn-outline-secondary" onclick="navigator.clipboard.writeText('${REMOTE_COUCHDB}')">
                                                    <i class="bi bi-clipboard"></i>
                                                </button>
                                            </div>
                                            <div class="form-text">CouchDB server for real-time sync</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="card mb-4">
                                    <div class="card-header bg-success text-white">
                                        <h6 class="mb-0"><i class="bi bi-github"></i> GitHub Backup</h6>
                                    </div>
                                    <div class="card-body">
                                        <form id="gitConfigForm" onsubmit="return settingsModule.saveGitConfig(event)">
                                            <div class="mb-3">
                                                <label class="form-label">GitHub Repository URL</label>
                                                <input type="text" class="form-control" id="gitRepoUrl" 
                                                       value="${gitRepoUrl}" 
                                                       placeholder="https://github.com/username/repo">
                                                <div class="form-text">Example: https://github.com/your-username/your-repo</div>
                                            </div>
                                            
                                            <div class="mb-3">
                                                <label class="form-label">GitHub Personal Access Token</label>
                                                <input type="password" class="form-control" id="gitToken" 
                                                       value="${gitToken}" 
                                                       placeholder="${gitToken ? '••••••••' : 'Enter token'}">
                                                <div class="form-text">
                                                    <a href="https://github.com/settings/tokens" target="_blank" class="text-decoration-none">
                                                        <i class="bi bi-box-arrow-up-right"></i> Create token with "repo" scope
                                                    </a>
                                                </div>
                                            </div>
                                            
                                            <div class="mb-3">
                                                <label class="form-label">Backup Interval (minutes)</label>
                                                <input type="number" class="form-control" id="backupInterval" 
                                                       value="${backupInterval}" min="5" max="1440">
                                                <div class="form-text">How often to automatically backup to GitHub</div>
                                            </div>
                                            
                                            <div class="d-grid">
                                                <button type="submit" class="btn btn-success">
                                                    <i class="bi bi-save"></i> Save GitHub Configuration
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Quick Actions -->
                        <div class="card mb-4">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="bi bi-lightning"></i> Quick Actions</h6>
                            </div>
                            <div class="card-body">
                                <div class="row g-2">
                                    <div class="col-md-3">
                                        <button class="btn btn-outline-primary w-100" onclick="syncManager.exportToJSON()">
                                            <i class="bi bi-download"></i> Export JSON
                                        </button>
                                    </div>
                                    <div class="col-md-3">
                                        <button class="btn btn-outline-success w-100" onclick="settingsModule.triggerGitBackup()">
                                            <i class="bi bi-cloud-upload"></i> Backup Now
                                        </button>
                                    </div>
                                    <div class="col-md-3">
                                        <button class="btn btn-outline-info w-100" onclick="settingsModule.testGitConnection()">
                                            <i class="bi bi-plug"></i> Test Connection
                                        </button>
                                    </div>
                                    <div class="col-md-3">
                                        <button class="btn btn-outline-warning w-100" onclick="document.getElementById('restore-file').click()">
                                            <i class="bi bi-upload"></i> Import File
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Backup Information -->
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0"><i class="bi bi-info-circle"></i> Backup Information</h6>
                            </div>
                            <div class="card-body">
                                <div id="backup-info">
                                    <div class="spinner-border spinner-border-sm text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    Loading backup information...
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Hidden file input for restore -->
                <input type="file" id="restore-file" accept=".json" style="display: none;" 
                       onchange="settingsModule.handleRestoreFile(event)">
            `;

            document.getElementById('settings-content').innerHTML = content;

            // Start updating live status
            this.startLiveStatusUpdate();

            // Load backup information
            this.loadBackupInfo();

        } catch (error) {
            console.error('Error loading sync settings:', error);
            app.showToast('Error loading sync settings: ' + error.message, 'danger');
        }
    },

    startLiveStatusUpdate() {
        this.updateLiveSyncStatus();
        // Update every 3 seconds
        this.liveStatusInterval = setInterval(() => this.updateLiveSyncStatus(), 3000);
    },

    stopLiveStatusUpdate() {
        if (this.liveStatusInterval) {
            clearInterval(this.liveStatusInterval);
        }
    },

    updateLiveSyncStatus() {
        const statusElement = document.getElementById('live-sync-status');
        const detailsElement = document.getElementById('live-sync-details');
        const alertElement = document.getElementById('sync-status-alert');

        if (statusElement && detailsElement && alertElement) {
            const status = syncManager.syncStatus;
            const statusText = syncManager.getStatusText(status);
            const statusColor = syncManager.getStatusColor(status);

            statusElement.textContent = statusText;
            statusElement.className = `badge bg-${statusColor}`;

            const details = {
                'connecting': 'Connecting to CouchDB server...',
                'syncing': 'Syncing data with server...',
                'synced': 'All data is synchronized',
                'error': 'Sync error - check connection',
                'disconnected': 'Offline mode',
                'backup_started': 'Starting Git backup...',
                'backup_completed': 'Git backup completed',
                'backup_error': 'Git backup failed',
                'restore_started': 'Restoring from Git...',
                'restore_completed': 'Restore completed',
                'restore_error': 'Restore failed'
            };

            detailsElement.textContent = details[status] || '';

            // Update alert class based on status
            const alertClasses = ['alert-info', 'alert-success', 'alert-warning', 'alert-danger'];
            alertElement.classList.remove(...alertClasses);

            if (status === 'synced') {
                alertElement.classList.add('alert-success');
            } else if (status === 'error' || status === 'backup_error' || status === 'restore_error') {
                alertElement.classList.add('alert-danger');
            } else if (status === 'disconnected') {
                alertElement.classList.add('alert-warning');
            } else {
                alertElement.classList.add('alert-info');
            }
        }
    },

    async loadBackupInfo() {
        try {
            const infoElement = document.getElementById('backup-info');

            // Get database stats
            const allDocs = await schema.getAllDocs();
            const stats = {
                total_docs: allDocs.length,
                last_update: new Date().toLocaleString()
            };

            // Check if Git is configured
            const gitRepoUrl = localStorage.getItem('gitRepoUrl');
            const gitToken = localStorage.getItem('gitToken');

            if (gitRepoUrl && gitToken) {
                infoElement.innerHTML = `
                    <div class="row">
                        <div class="col-md-6">
                            <h6>Local Database</h6>
                            <table class="table table-sm">
                                <tr>
                                    <th>Name:</th>
                                    <td><code>${DB_NAME}</code></td>
                                </tr>
                                <tr>
                                    <th>Total Documents:</th>
                                    <td><span class="badge bg-primary">${stats.total_docs}</span></td>
                                </tr>
                                <tr>
                                    <th>Last Updated:</th>
                                    <td>${stats.last_update}</td>
                                </tr>
                            </table>
                        </div>
                        <div class="col-md-6">
                            <h6>GitHub Backup</h6>
                            <table class="table table-sm">
                                <tr>
                                    <th>Status:</th>
                                    <td><span class="badge bg-warning" id="git-validation-status">Validating...</span></td>
                                </tr>
                                <tr>
                                    <th>Repository:</th>
                                    <td><small>${gitRepoUrl}</small></td>
                                </tr>
                                <tr>
                                    <th>Token Status:</th>
                                    <td id="token-status">Checking...</td>
                                </tr>
                                <tr>
                                    <th>Interval:</th>
                                    <td>${localStorage.getItem('backupInterval') || '30'} minutes</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    <div id="backup-details" class="mt-3"></div>
                `;

                // Validate GitHub token
                await this.validateAndUpdateBackupInfo();

            } else {
                infoElement.innerHTML = `
                    <div class="alert alert-info">
                        <i class="bi bi-info-circle"></i>
                        <strong>No GitHub Backup Configured</strong>
                        <p class="mb-0">Configure GitHub backup above to enable automatic cloud backups.</p>
                    </div>
                    <div class="mt-3">
                        <h6>Local Database Information</h6>
                        <table class="table table-sm">
                            <tr>
                                <th>Database:</th>
                                <td><code>${DB_NAME}</code></td>
                            </tr>
                            <tr>
                                <th>Total Documents:</th>
                                <td><span class="badge bg-primary">${stats.total_docs}</span></td>
                            </tr>
                            <tr>
                                <th>Last Update:</th>
                                <td>${stats.last_update}</td>
                            </tr>
                        </table>
                    </div>
                `;
            }

        } catch (error) {
            console.error('Error loading backup info:', error);
            document.getElementById('backup-info').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle"></i>
                    Error loading backup information
                </div>
            `;
        }
    },

    async validateAndUpdateBackupInfo() {
        try {
            const validation = await syncManager.validateGitHubToken();
            const statusElement = document.getElementById('git-validation-status');
            const tokenStatusElement = document.getElementById('token-status');
            const detailsElement = document.getElementById('backup-details');

            if (validation.valid) {
                statusElement.textContent = 'Valid ✓';
                statusElement.className = 'badge bg-success';
                tokenStatusElement.textContent = 'Token is valid';
                tokenStatusElement.className = 'text-success';
                
                detailsElement.innerHTML = `
                    <div class="alert alert-success">
                        <i class="bi bi-check-circle"></i>
                        <strong>GitHub backup is properly configured!</strong>
                        <ul class="mb-0 mt-2">
                            <li>Repository: <strong>${validation.repoName}</strong></li>
                            <li>Push access: ${validation.permissions.push ? '✓' : '✗'}</li>
                            <li>Pull access: ${validation.permissions.pull ? '✓' : '✗'}</li>
                            <li>Admin access: ${validation.permissions.admin ? '✓' : '✗'}</li>
                        </ul>
                    </div>
                `;
                
            } else {
                statusElement.textContent = 'Invalid ✗';
                statusElement.className = 'badge bg-danger';
                tokenStatusElement.textContent = 'Token is invalid';
                tokenStatusElement.className = 'text-danger';
                
                detailsElement.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle"></i>
                        <strong>GitHub configuration error:</strong>
                        <p class="mb-0 mt-2">${validation.error}</p>
                        <p class="mb-0">Please check your:
                            <ul>
                                <li>GitHub repository URL format</li>
                                <li>Personal access token (requires "repo" scope)</li>
                                <li>Network connectivity</li>
                            </ul>
                        </p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error validating GitHub token:', error);
        }
    },

    async saveGitConfig(event) {
        event.preventDefault();

        try {
            const repoUrl = document.getElementById('gitRepoUrl').value.trim();
            const token = document.getElementById('gitToken').value;
            const interval = document.getElementById('backupInterval').value;

            // Validate inputs
            if (repoUrl && (!repoUrl.startsWith('https://github.com/') || repoUrl.split('/').length < 5)) {
                app.showToast('Please enter a valid GitHub repository URL', 'warning');
                return;
            }

            if (interval && (parseInt(interval) < 5 || parseInt(interval) > 1440)) {
                app.showToast('Backup interval must be between 5 and 1440 minutes', 'warning');
                return;
            }

            if (repoUrl && token && token === '••••••••') {
                // Token is masked, keep existing token
                const currentToken = localStorage.getItem('gitToken');
                if (currentToken) {
                    await syncManager.setupGitBackup(repoUrl, currentToken, parseInt(interval));
                    app.showToast('GitHub configuration updated (token preserved)', 'success');
                }
            } else if (repoUrl && token) {
                // New token provided
                localStorage.setItem('gitRepoUrl', repoUrl);
                localStorage.setItem('gitToken', token);
                localStorage.setItem('backupInterval', interval);

                await syncManager.setupGitBackup(repoUrl, token, parseInt(interval));
                app.showToast('GitHub configuration saved successfully', 'success');
            } else if (!repoUrl || !token) {
                // Disable Git backup
                localStorage.removeItem('gitRepoUrl');
                localStorage.removeItem('gitToken');
                localStorage.removeItem('backupInterval');

                syncManager.gitBackupEnabled = false;
                if (syncManager.backupInterval) {
                    clearInterval(syncManager.backupInterval);
                    syncManager.backupInterval = null;
                }

                app.showToast('GitHub backup disabled', 'info');
            }

            // Reload backup info
            await this.loadBackupInfo();

        } catch (error) {
            console.error('Error saving Git config:', error);
            app.showToast('Error saving configuration: ' + error.message, 'danger');
        }
    },

    async triggerGitBackup() {
        try {
            if (!syncManager.gitBackupEnabled || !syncManager.gitRepoUrl || !syncManager.gitToken) {
                app.showToast('Please configure GitHub backup first', 'warning');
                return;
            }

            await syncManager.manualBackup();

        } catch (error) {
            console.error('Error triggering backup:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async testGitConnection() {
        try {
            const gitRepoUrl = localStorage.getItem('gitRepoUrl');
            const gitToken = localStorage.getItem('gitToken');
            
            if (!gitRepoUrl || !gitToken) {
                app.showToast('Please configure GitHub backup first', 'warning');
                return;
            }
            
            app.showLoading(true, 'Testing GitHub connection...');
            
            // Test the connection
            syncManager.gitRepoUrl = gitRepoUrl;
            syncManager.gitToken = gitToken;
            
            const validation = await syncManager.validateGitHubToken();
            
            app.showLoading(false);
            
            if (validation.valid) {
                const permissions = validation.permissions;
                const message = `Connection successful!\n\nRepository: ${validation.repoName}\n\nPermissions:\n• Push: ${permissions.push ? '✓' : '✗'}\n• Pull: ${permissions.pull ? '✓' : '✗'}\n• Admin: ${permissions.admin ? '✓' : '✗'}`;
                
                app.showModal('GitHub Connection Test', `
                    <div class="alert alert-success">
                        <i class="bi bi-check-circle-fill"></i>
                        <strong>Success!</strong> Connected to GitHub repository.
                    </div>
                    <div class="mt-3">
                        <h6>Connection Details:</h6>
                        <table class="table table-sm">
                            <tr>
                                <th>Repository:</th>
                                <td>${validation.repoName}</td>
                            </tr>
                            <tr>
                                <th>Push Access:</th>
                                <td>${permissions.push ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-danger">No</span>'}</td>
                            </tr>
                            <tr>
                                <th>Pull Access:</th>
                                <td>${permissions.pull ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-danger">No</span>'}</td>
                            </tr>
                            <tr>
                                <th>Admin Access:</th>
                                <td>${permissions.admin ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-danger">No</span>'}</td>
                            </tr>
                        </table>
                    </div>
                    <div class="mt-3">
                        <button class="btn btn-success w-100" onclick="syncManager.manualBackup(); app.hideModal();">
                            <i class="bi bi-cloud-upload"></i> Test Backup Now
                        </button>
                    </div>
                `);
            } else {
                app.showToast(`✗ Connection failed: ${validation.error}`, 'danger');
            }
            
        } catch (error) {
            app.showLoading(false);
            console.error('Error testing Git connection:', error);
            app.showToast('Test failed: ' + error.message, 'danger');
        }
    },

    handleRestoreFile(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (confirm('Restore from file? This will replace all local data.')) {
            syncManager.importFromJSON(file);
        }

        // Reset file input
        event.target.value = '';
    },

    // DATABASE SETTINGS
    async showDatabaseSettings() {
        try {
            this.updateMenuActive('Database');

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

        } catch (error) {
            console.error('Error loading database settings:', error);
            app.showToast('Error loading database settings: ' + error.message, 'danger');
        }
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

            if (statusElement) {
                statusElement.textContent = syncManager.getStatusText(syncStatus);
                statusElement.className = `badge bg-${syncManager.getStatusColor(syncStatus)}`;
            }

        } catch (error) {
            console.error('Error checking sync status:', error);
        }
    },

    async backupDatabase() {
        try {
            await syncManager.exportToJSON();
        } catch (error) {
            console.error('Error backing up database:', error);
            app.showToast('Error creating backup', 'danger');
        }
    },

    async clearDatabase() {
        try {
            const user = authManager.getCurrentUser();
            if (user.role !== 'admin') {
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

// Add CSS for the settings module
const settingsStyles = `
    .account-type-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8em;
        font-weight: 600;
    }
    .account-type-badge.asset { background: #d1e7dd; color: #0f5132; }
    .account-type-badge.liability { background: #f8d7da; color: #842029; }
    .account-type-badge.income { background: #cff4fc; color: #055160; }
    .account-type-badge.expense { background: #fff3cd; color: #664d03; }
    .account-type-badge.supplier { background: #d7e5f2; color: #084298; }
    .account-type-badge.buyer { background: #e2d9f3; color: #42275a; }
    
    #live-sync-status {
        font-size: 0.9em;
        padding: 5px 10px;
    }
    
    #settings-menu .list-group-item {
        border: none;
        border-radius: 0.375rem;
        margin-bottom: 2px;
        transition: all 0.2s;
    }
    
    #settings-menu .list-group-item:hover {
        background-color: #f8f9fa;
        transform: translateX(2px);
    }
    
    #settings-menu .list-group-item.active {
        background-color: #0d6efd;
        border-color: #0d6efd;
    }
    
    .sync-status-alert {
        border-left: 4px solid #0dcaf0;
    }
    
    .sync-status-alert.alert-success {
        border-left-color: #198754;
    }
    
    .sync-status-alert.alert-danger {
        border-left-color: #dc3545;
    }
    
    .sync-status-alert.alert-warning {
        border-left-color: #ffc107;
    }
`;

// Add styles to document
if (!document.querySelector('#settings-styles')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'settings-styles';
    styleElement.textContent = settingsStyles;
    document.head.appendChild(styleElement);
}

// Export the module
window.settingsModule = settingsModule;

// Add configuration UI function
window.showSyncConfig = function() {
    const currentRepo = localStorage.getItem('gitRepoUrl') || '';
    const currentToken = localStorage.getItem('gitToken') || '';
    const interval = localStorage.getItem('backupInterval') || '30';
    const enableAutoSync = localStorage.getItem('enableAutoSync') !== 'false';
    
    const configHtml = `
        <div class="modal fade" id="syncConfigModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Sync Configuration</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="mb-3">
                            <label class="form-label">GitHub Repository URL</label>
                            <input type="text" class="form-control" id="gitRepoUrl" 
                                   value="${currentRepo}" 
                                   placeholder="https://github.com/username/repo">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">GitHub Token</label>
                            <input type="password" class="form-control" id="gitToken" 
                                   value="${currentToken}" 
                                   placeholder="GitHub personal access token">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Backup Interval (minutes)</label>
                            <input type="number" class="form-control" id="backupInterval" 
                                   value="${interval}" min="5" max="1440">
                        </div>
                        <div class="form-check mb-3">
                            <input class="form-check-input" type="checkbox" id="enableAutoSync" 
                                   ${enableAutoSync ? 'checked' : ''}>
                            <label class="form-check-label">Enable auto-sync with CouchDB</label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-primary" onclick="saveSyncConfig()">Save</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('syncConfigModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', configHtml);
    
    const modal = new bootstrap.Modal(document.getElementById('syncConfigModal'));
    modal.show();
};

window.saveSyncConfig = function() {
    const repoUrl = document.getElementById('gitRepoUrl').value;
    const token = document.getElementById('gitToken').value;
    const interval = document.getElementById('backupInterval').value;
    const enableAutoSync = document.getElementById('enableAutoSync').checked;
    
    // Save to localStorage
    if (repoUrl) localStorage.setItem('gitRepoUrl', repoUrl);
    if (token) localStorage.setItem('gitToken', token);
    localStorage.setItem('backupInterval', interval);
    localStorage.setItem('enableAutoSync', enableAutoSync.toString());
    
    // Configure sync manager
    if (repoUrl && token) {
        syncManager.setupGitBackup(repoUrl, token, parseInt(interval));
    }
    
    if (enableAutoSync) {
        syncManager.setupCouchDBSync();
    } else {
        syncManager.stopSync();
    }
    
    bootstrap.Modal.getInstance(document.getElementById('syncConfigModal')).hide();
    syncManager.showNotification('Sync configuration saved', 'success');
};

// Add to existing initialization
async function initializeDatabase() {
    try {
        await schema.waitForInit();
        
        // Check existing settings for sync configuration
        const settings = await schema.findDocs('setting');
        const generalSettings = settings.find(s => s.setting_type === 'general') || {};
        
        if (generalSettings.enable_auto_sync) {
            syncManager.setupCouchDBSync();
        }
        
        // Check for Git configuration
        const gitRepoUrl = localStorage.getItem('gitRepoUrl');
        const gitToken = localStorage.getItem('gitToken');
        const backupInterval = localStorage.getItem('backupInterval') || '30';
        
        if (gitRepoUrl && gitToken) {
            syncManager.setupGitBackup(gitRepoUrl, gitToken, parseInt(backupInterval));
        }
        
        // Rest of your existing initialization code...
        // [Keep all your existing initializeDatabase code here]
        
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Add sync manager to schema for easy access
schema.syncManager = syncManager;

// Export for use in other modules
window.schema = schema;
window.db = db;
window.syncManager = syncManager;