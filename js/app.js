// Main Application
class TextileERPApp {
    constructor() {
        this.currentModule = 'dashboard';
        this.modal = new bootstrap.Modal(document.getElementById('formModal'));
        this.modules = {};
        this.init();
    }

    async init() {
        // Check authentication
        const user = authManager.checkAuth();
        if (user) {
            await this.showApp(user);
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
    }

    async showApp(user) {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        
        // Set user info
        document.getElementById('current-user').textContent = `${user.name} (${user.role})`;
        document.getElementById('user-role-display').textContent = user.role.toUpperCase();
        
        // Initialize modules based on permissions
        await this.initializeModules(user);
        
        // Load dashboard
        await this.showModule('dashboard');
        
        // Setup sync
        await syncManager.setupSync();
    }

    async initializeModules(user) {
        // Clear existing menu
        const menu = document.getElementById('main-menu');
        menu.innerHTML = '';
        
        // Load modules based on permissions
        const availableModules = [];
        
        if (authManager.hasPermission('dashboard')) {
            availableModules.push('dashboard');
            this.addMenuItem(menu, 'Dashboard', 'dashboard', 'bi-speedometer2');
            this.modules.dashboard = dashboardModule;
        }
        
        if (authManager.hasPermission('inventory')) {
            availableModules.push('inventory');
            this.addMenuItem(menu, 'Inventory', 'inventory', 'bi-box-seam');
            this.modules.inventory = inventoryModule;
        }
        
        if (authManager.hasPermission('purchase')) {
            availableModules.push('purchase');
            this.addMenuItem(menu, 'Purchase', 'purchase', 'bi-cart-plus');
            this.modules.purchase = purchaseModule;
        }
        
        if (authManager.hasPermission('dying')) {
            availableModules.push('dying');
            this.addMenuItem(menu, 'Dying', 'dying', 'bi-palette');
            this.modules.dying = dyingModule;
        }
        
        if (authManager.hasPermission('packing')) {
            availableModules.push('packing');
            this.addMenuItem(menu, 'Packing', 'packing', 'bi-box');
            this.modules.packing = packingModule;
        }
        
        if (authManager.hasPermission('sales')) {
            availableModules.push('sales');
            this.addMenuItem(menu, 'Sales', 'sales', 'bi-cash-coin');
            this.modules.sales = salesModule;
        }
        
        if (authManager.hasPermission('accounts')) {
            availableModules.push('accounts');
            this.addMenuItem(menu, 'Accounts', 'accounts', 'bi-journal-bookmark');
            this.modules.accounts = accountsModule;
        }
        
        if (authManager.hasPermission('vouchers')) {
            availableModules.push('vouchers');
            this.addMenuItem(menu, 'Vouchers', 'vouchers', 'bi-receipt');
            this.modules.vouchers = vouchersModule;
        }
        
        if (authManager.hasPermission('reports')) {
            availableModules.push('reports');
            this.addMenuItem(menu, 'Reports', 'reports', 'bi-graph-up');
            this.modules.reports = reportsModule;
        }
        
        if (authManager.hasPermission('settings')) {
            availableModules.push('settings');
            this.addMenuItem(menu, 'Settings', 'settings', 'bi-gear');
            this.modules.settings = settingsModule;
        }
        
        if (authManager.hasPermission('users')) {
            availableModules.push('users');
            this.addMenuItem(menu, 'Users', 'users', 'bi-people');
            this.modules.users = usersModule;
        }
        
        console.log('Available modules:', availableModules);
    }

    addMenuItem(menu, text, module, icon) {
        const menuItem = document.createElement('a');
        menuItem.className = 'nav-link';
        menuItem.href = '#';
        menuItem.innerHTML = `<i class="bi ${icon}"></i> ${text}`;
        menuItem.onclick = (e) => {
            e.preventDefault();
            this.showModule(module);
            
            // Update active state
            document.querySelectorAll('#main-menu .nav-link').forEach(item => {
                item.classList.remove('active');
            });
            menuItem.classList.add('active');
        };
        menu.appendChild(menuItem);
    }

    async showModule(moduleName) {
        this.currentModule = moduleName;
        const moduleTitle = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
        document.getElementById('module-title').textContent = moduleTitle;
        
        if (this.modules[moduleName]) {
            await this.modules[moduleName].load();
        } else {
            console.error(`Module ${moduleName} not found or not authorized`);
        }
    }

    async showLoginForm() {
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        document.getElementById('login-message').innerHTML = '';
    }

    async showRegisterForm() {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        document.getElementById('login-message').innerHTML = '';
    }

    async login(username, password) {
        try {
            this.showLoading(true);
            const user = await authManager.login(username, password);
            await this.showApp(user);
            this.showToast('Login successful!', 'success');
        } catch (error) {
            this.showToast(error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    async register(userData) {
        try {
            this.showLoading(true);
            await authManager.register(userData);
            this.showToast('Registration successful! Please login.', 'success');
            this.showLoginForm();
        } catch (error) {
            this.showToast(error.message, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    logout() {
        authManager.logout();
    }

    async syncNow() {
        try {
            await syncManager.syncNow();
            this.showToast('Sync started...', 'info');
        } catch (error) {
            this.showToast('Error syncing: ' + error.message, 'danger');
        }
    }

    // Utility methods
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        const container = document.createElement('div');
        container.className = 'toast-container';
        container.appendChild(toast);
        document.body.appendChild(container);
        
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            container.remove();
        });
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showModal(title, content) {
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalBody').innerHTML = content;
        this.modal.show();
    }

    hideModal() {
        this.modal.hide();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new TextileERPApp();
    window.app = app;

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            await app.login(username, password);
        });
    } else {
        console.warn('login-form not found');
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm-password').value;

            if (password !== confirmPassword) {
                app.showToast('Passwords do not match', 'danger');
                return;
            }

            const userData = {
                name: document.getElementById('reg-name').value,
                username: document.getElementById('reg-username').value,
                email: document.getElementById('reg-email').value,
                password: password,
                role: document.getElementById('reg-role').value
            };

            await app.register(userData);
        });
    } else {
        console.warn('register-form not found');
    }
});
