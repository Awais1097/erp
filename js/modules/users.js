// Users Management Module
const usersModule = {
    async load() {
        // Check if user has permission to access this module
        if (!authManager.hasPermission('users')) {
            document.getElementById('content-area').innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="bi bi-shield-exclamation"></i> Access Denied</h4>
                    <p>You don't have permission to access the Users module.</p>
                </div>
            `;
            return;
        }
        
        const content = `
            <div class="d-flex justify-content-between mb-4">
                <h4><i class="bi bi-people"></i> User Management</h4>
                <button class="btn btn-primary" onclick="usersModule.showUserForm()">
                    <i class="bi bi-person-plus"></i> Add User
                </button>
            </div>
            
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body">
                                Loading...
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.loadUsersTable();
    },

    async loadUsersTable() {
        try {
            const users = await authManager.getAllUsers();
            const currentUser = authManager.getCurrentUser();
            
            const html = users.map(user => {
                // Don't allow editing your own role/status
                const isCurrentUser = user._id === currentUser._id;
                
                return `
                    <tr>
                        <td>${user.username}</td>
                        <td>${user.name}</td>
                        <td>${user.email || '-'}</td>
                        <td>
                            <span class="badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'manager' ? 'bg-warning' : 'bg-info'}">
                                ${user.role}
                            </span>
                        </td>
                        <td>
                            <span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                                ${user.status}
                            </span>
                        </td>
                        <td>${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td>
                        <td>
                            <button class="btn btn-sm btn-outline-primary" onclick="usersModule.viewUser('${user._id}')">
                                <i class="bi bi-eye"></i>
                            </button>
                            ${!isCurrentUser ? `
                            <button class="btn btn-sm btn-outline-warning" onclick="usersModule.editUser('${user._id}')">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-${user.status === 'active' ? 'danger' : 'success'}" 
                                    onclick="usersModule.toggleUserStatus('${user._id}', '${user.status}')">
                                <i class="bi bi-${user.status === 'active' ? 'person-x' : 'person-check'}"></i>
                            </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('users-table-body').innerHTML = html || '<tr><td colspan="7">No users found</td></tr>';
        } catch (error) {
            console.error('Error loading users:', error);
            document.getElementById('users-table-body').innerHTML = '<tr><td colspan="7">Error loading users</td></tr>';
        }
    },

    async showUserForm(userId = null) {
        try {
            let userData = {};
            if (userId) {
                const user = await schema.getDoc(userId);
                userData = user;
            }
            
            const formHtml = `
                <form id="userForm" onsubmit="return usersModule.saveUser(event)">
                    ${userId ? `<input type="hidden" id="userId" value="${userId}">` : ''}
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Full Name *</label>
                            <input type="text" class="form-control" id="userName" 
                                   value="${userData.name || ''}" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Username *</label>
                            <input type="text" class="form-control" id="userUsername" 
                                   value="${userData.username || ''}" ${userId ? 'readonly' : 'required'}>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" id="userEmail" 
                                   value="${userData.email || ''}">
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Role *</label>
                            <select class="form-select" id="userRole" required>
                                <option value="user" ${userData.role === 'user' ? 'selected' : ''}>User</option>
                                <option value="manager" ${userData.role === 'manager' ? 'selected' : ''}>Manager</option>
                                <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>Administrator</option>
                            </select>
                        </div>
                    </div>
                    
                    ${!userId ? `
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Password *</label>
                            <input type="password" class="form-control" id="userPassword" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label class="form-label">Confirm Password *</label>
                            <input type="password" class="form-control" id="userConfirmPassword" required>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" id="userStatus">
                            <option value="active" ${userData.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="inactive" ${userData.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                            <option value="suspended" ${userData.status === 'suspended' ? 'selected' : ''}>Suspended</option>
                        </select>
                    </div>
                    
                    <button type="submit" class="btn btn-primary">${userId ? 'Update' : 'Create'} User</button>
                </form>
            `;
            
            app.showModal(userId ? 'Edit User' : 'Add New User', formHtml);
        } catch (error) {
            console.error('Error showing user form:', error);
            app.showToast('Error loading form: ' + error.message, 'danger');
        }
    },

    async saveUser(event) {
        event.preventDefault();
        
        try {
            const userId = document.getElementById('userId')?.value;
            
            if (!userId) {
                // Creating new user
                const password = document.getElementById('userPassword').value;
                const confirmPassword = document.getElementById('userConfirmPassword').value;
                
                if (password !== confirmPassword) {
                    app.showToast('Passwords do not match', 'danger');
                    return;
                }
                
                const userData = {
                    username: document.getElementById('userUsername').value,
                    password: password,
                    name: document.getElementById('userName').value,
                    email: document.getElementById('userEmail').value,
                    role: document.getElementById('userRole').value,
                    status: document.getElementById('userStatus').value,
                    created_by: authManager.getCurrentUser().username
                };
                
                await authManager.register(userData);
                app.showToast('User created successfully!', 'success');
            } else {
                // Updating existing user
                const user = await schema.getDoc(userId);
                const updatedUser = {
                    ...user,
                    name: document.getElementById('userName').value,
                    email: document.getElementById('userEmail').value,
                    role: document.getElementById('userRole').value,
                    status: document.getElementById('userStatus').value,
                    updated_at: new Date().toISOString()
                };
                
                await schema.updateDoc(updatedUser);
                app.showToast('User updated successfully!', 'success');
            }
            
            app.hideModal();
            await this.loadUsersTable();
        } catch (error) {
            console.error('Error saving user:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async viewUser(userId) {
        try {
            const user = await schema.getDoc(userId);
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Username</th><td>${user.username}</td></tr>
                            <tr><th>Name</th><td>${user.name}</td></tr>
                            <tr><th>Email</th><td>${user.email || '-'}</td></tr>
                            <tr><th>Role</th><td><span class="badge ${user.role === 'admin' ? 'bg-danger' : user.role === 'manager' ? 'bg-warning' : 'bg-info'}">${user.role}</span></td></tr>
                            <tr><th>Status</th><td><span class="badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}">${user.status}</span></td></tr>
                            <tr><th>Created</th><td>${new Date(user.created_at).toLocaleString()}</td></tr>
                            <tr><th>Last Updated</th><td>${new Date(user.updated_at).toLocaleString()}</td></tr>
                            <tr><th>Last Login</th><td>${user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <h6>Permissions</h6>
                        <ul class="list-group">
                            ${authManager.permissions[user.role]?.map(permission => `
                                <li class="list-group-item">
                                    <i class="bi bi-check-circle text-success"></i> ${permission}
                                </li>
                            `).join('') || '<li class="list-group-item">No permissions</li>'}
                        </ul>
                    </div>
                </div>
            `;
            
            app.showModal('User Details - ' + user.name, content);
        } catch (error) {
            console.error('Error viewing user:', error);
            app.showToast('Error loading user details', 'danger');
        }
    },

    async editUser(userId) {
        await this.showUserForm(userId);
    },

    async toggleUserStatus(userId, currentStatus) {
        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const user = await schema.getDoc(userId);
            
            if (confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this user?`)) {
                user.status = newStatus;
                await schema.updateDoc(user);
                app.showToast(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
                await this.loadUsersTable();
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            app.showToast('Error updating user status', 'danger');
        }
    },

    async resetUserPassword(userId) {
        try {
            const newPassword = prompt('Enter new password for user:');
            if (!newPassword) return;
            
            const user = await schema.getDoc(userId);
            user.password = newPassword; // In production, hash this
            await schema.updateDoc(user);
            
            app.showToast('Password reset successfully', 'success');
        } catch (error) {
            console.error('Error resetting password:', error);
            app.showToast('Error resetting password', 'danger');
        }
    }
};