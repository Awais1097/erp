// Authentication Manager
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.permissions = {
            admin: ['dashboard', 'inventory', 'purchase', 'dying', 'packing', 'sales', 'accounts', 'vouchers', 'reports', 'settings', 'users'],
            manager: ['dashboard', 'inventory', 'purchase', 'dying', 'packing', 'sales', 'accounts', 'vouchers', 'reports'],
            user: ['dashboard', 'inventory', 'purchase', 'dying', 'packing', 'sales']
        };
        
        // Initialize after schema is ready
        this.initialize();
    }

    async initialize() {
        try {
            await schema.waitForInit();
            this.checkAuth();
        } catch (error) {
            console.error('Error initializing auth manager:', error);
        }
    }

    async login(username, password) {
        try {
            // Wait for schema to be ready
            await schema.waitForInit();
            
            // Find user by username (fallback method if view doesn't work)
            let user;
            try {
                // Try using view first
                const users = await schema.queryView('users_by_username', { key: username });
                user = users[0];
                
                if (!user) {
                    // Fallback: search all users
                    const allUsers = await schema.findDocs('user');
                    user = allUsers.find(u => u.username === username);
                }
            } catch (viewError) {
                // View doesn't exist, use direct search
                console.log('View not available, using direct search');
                const allUsers = await schema.findDocs('user');
                user = allUsers.find(u => u.username === username);
            }
            
            if (!user) {
                throw new Error('User not found');
            }
            
            if (user.status !== 'active') {
                throw new Error('Account is disabled');
            }
            
            // In production, use proper password hashing
            // For demo, we're using plain text
            if (user.password !== password) {
                throw new Error('Invalid password');
            }
            
            this.currentUser = {
                _id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                role: user.role,
                permissions: this.permissions[user.role] || this.permissions.user,
                user_permissions: user.permissions || []
            };
            
            // Update last login
            user.last_login = new Date().toISOString();
            await schema.updateDoc(user);
            
            // Store session
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            return this.currentUser;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async register(userData) {
        try {
            await schema.waitForInit();
            
            // Only admin can create users
            const currentUser = this.getCurrentUser();
            if (!currentUser || currentUser.role !== 'admin') {
                throw new Error('Only administrators can create new users');
            }
            
            // Check if username already exists
            let existingUsers = [];
            try {
                existingUsers = await schema.queryView('users_by_username', { key: userData.username });
            } catch (viewError) {
                // View might not exist, search directly
                const allUsers = await schema.findDocs('user');
                existingUsers = allUsers.filter(u => u.username === userData.username);
            }
            
            if (existingUsers.length > 0) {
                throw new Error('Username already exists');
            }
            
            // Validate role
            const validRoles = ['admin', 'manager', 'user'];
            if (!validRoles.includes(userData.role)) {
                throw new Error('Invalid role specified');
            }
            
            // Set permissions based on role
            const userPermissions = this.permissions[userData.role] || this.permissions.user;
            
            // Create new user
            const user = await schema.createDoc('user', {
                username: userData.username,
                password: userData.password, // In production, hash this
                name: userData.name,
                email: userData.email,
                role: userData.role,
                permissions: userPermissions,
                status: 'active',
                created_by: currentUser.username,
                last_login: null
            });
            
            return user;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.reload();
    }

    checkAuth() {
        try {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                this.currentUser = JSON.parse(storedUser);
                return this.currentUser;
            }
            return null;
        } catch (error) {
            console.error('Error checking auth:', error);
            return null;
        }
    }

    hasPermission(module) {
        if (!this.currentUser) return false;
        if (this.currentUser.role === 'admin') return true;
        
        // Check role-based permissions
        if (this.currentUser.permissions?.includes(module)) {
            return true;
        }
        
        // Check user-specific permissions
        if (this.currentUser.user_permissions?.includes(module)) {
            return true;
        }
        
        return false;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async getAllUsers() {
        try {
            await schema.waitForInit();
            return await schema.findDocs('user');
        } catch (error) {
            console.error('Error getting users:', error);
            return [];
        }
    }

    async updateUser(userId, userData) {
        try {
            await schema.waitForInit();
            const user = await schema.getDoc(userId);
            const updatedUser = { ...user, ...userData };
            return await schema.updateDoc(updatedUser);
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    async deleteUser(userId) {
        try {
            await schema.waitForInit();
            const user = await schema.getDoc(userId);
            user.status = 'inactive';
            return await schema.updateDoc(user);
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    async resetPassword(userId, newPassword) {
        try {
            await schema.waitForInit();
            const user = await schema.getDoc(userId);
            user.password = newPassword; // In production, hash this
            return await schema.updateDoc(user);
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    }

    async changeOwnPassword(currentPassword, newPassword) {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) {
                throw new Error('User not logged in');
            }
            
            // Verify current password
            const user = await schema.getDoc(currentUser._id);
            if (user.password !== currentPassword) {
                throw new Error('Current password is incorrect');
            }
            
            // Update password
            user.password = newPassword; // In production, hash this
            await schema.updateDoc(user);
            
            return true;
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }

    async getUsersByRole(role) {
        try {
            await schema.waitForInit();
            const users = await schema.findDocs('user');
            return users.filter(user => user.role === role && user.status === 'active');
        } catch (error) {
            console.error('Error getting users by role:', error);
            return [];
        }
    }

    async getUserActivity(userId) {
        try {
            await schema.waitForInit();
            const activities = [];
            
            // Get user's recent creations (simplified)
            const allDocs = await schema.getAllDocs();
            
            allDocs.forEach(doc => {
                if (doc.created_by === userId) {
                    activities.push({
                        type: doc.type,
                        _id: doc._id,
                        created_at: doc.created_at,
                        description: `${doc.type} created`
                    });
                }
            });
            
            // Sort by date
            activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            return activities.slice(0, 50); // Return last 50 activities
        } catch (error) {
            console.error('Error getting user activity:', error);
            return [];
        }
    }

    async updateUserPermissions(userId, permissions) {
        try {
            await schema.waitForInit();
            const user = await schema.getDoc(userId);
            
            // Validate permissions
            const validModules = ['dashboard', 'inventory', 'purchase', 'dying', 'packing', 'sales', 'accounts', 'vouchers', 'reports', 'settings', 'users'];
            const validPermissions = permissions.filter(p => validModules.includes(p));
            
            user.permissions = validPermissions;
            return await schema.updateDoc(user);
        } catch (error) {
            console.error('Error updating user permissions:', error);
            throw error;
        }
    }

    // Permission management methods
    getAvailableModules() {
        return [
            { id: 'dashboard', name: 'Dashboard', description: 'Main dashboard and overview' },
            { id: 'inventory', name: 'Inventory', description: 'Lot-based inventory management' },
            { id: 'purchase', name: 'Purchase', description: 'Gray cloth purchase and rejection' },
            { id: 'dying', name: 'Dying', description: 'Cloth dyeing process management' },
            { id: 'packing', name: 'Packing', description: 'Cloth packing process management' },
            { id: 'sales', name: 'Sales', description: 'Sales and invoice management' },
            { id: 'accounts', name: 'Accounts', description: 'Chart of accounts management' },
            { id: 'vouchers', name: 'Vouchers', description: 'Double-entry voucher system' },
            { id: 'reports', name: 'Reports', description: 'Reports and analytics' },
            { id: 'settings', name: 'Settings', description: 'System settings and configuration' },
            { id: 'users', name: 'Users', description: 'User management' }
        ];
    }

    getModulePermissions(moduleId) {
        const modules = this.getAvailableModules();
        const module = modules.find(m => m.id === moduleId);
        return module ? module : null;
    }

    async auditLogin(userId, ipAddress, userAgent, success) {
        try {
            await schema.waitForInit();
            const auditLog = {
                type: 'audit_log',
                user_id: userId,
                action: 'login',
                ip_address: ipAddress,
                user_agent: userAgent,
                success: success,
                timestamp: new Date().toISOString()
            };
            
            await schema.createDoc('audit_log', auditLog);
        } catch (error) {
            console.error('Error logging audit:', error);
        }
    }

    async getAuditLogs(userId = null, limit = 100) {
        try {
            await schema.waitForInit();
            const auditLogs = await schema.findDocs('audit_log');
            
            let filteredLogs = auditLogs;
            if (userId) {
                filteredLogs = auditLogs.filter(log => log.user_id === userId);
            }
            
            // Sort by timestamp and limit
            filteredLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return filteredLogs.slice(0, limit);
        } catch (error) {
            console.error('Error getting audit logs:', error);
            return [];
        }
    }

    // Session management
    async validateSession() {
        const currentUser = this.checkAuth();
        if (!currentUser) {
            return false;
        }
        
        // Check if user still exists and is active
        try {
            const user = await schema.getDoc(currentUser._id);
            if (!user || user.status !== 'active') {
                this.logout();
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error validating session:', error);
            return false;
        }
    }

    async refreshUserData() {
        try {
            const currentUser = this.getCurrentUser();
            if (!currentUser) return;
            
            const user = await schema.getDoc(currentUser._id);
            if (user) {
                this.currentUser = {
                    ...currentUser,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status
                };
                
                // Update localStorage
                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    }
}

// Initialize auth manager
const authManager = new AuthManager();
window.authManager = authManager;