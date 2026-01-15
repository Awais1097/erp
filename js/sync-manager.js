// Enhanced Sync Manager with Git Backup
class EnhancedSyncManager {
    constructor() {
        this.remoteDB = null;
        this.syncHandler = null;
        this.isSyncing = false;
        this.syncStatus = 'disconnected';
        this.gitBackupEnabled = false;
        this.gitRepoUrl = null;
        this.gitToken = null;
        this.backupInterval = null;
        this.initRemoteDB();
    }

    initRemoteDB() {
        try {
            this.remoteDB = new PouchDB(REMOTE_COUCHDB);
            console.log('Remote CouchDB initialized');
        } catch (error) {
            console.error('Error initializing remote DB:', error);
        }
    }

    // CouchDB Sync Methods
    async setupCouchDBSync() {
        if (!this.remoteDB) {
            console.log('CouchDB sync not configured');
            return null;
        }

        try {
            if (this.syncHandler) {
                this.syncHandler.cancel();
            }

            this.syncHandler = db.sync(this.remoteDB, {
                live: true,
                retry: true,
                timeout: 60000 // 60 seconds timeout
            });

            this.syncHandler
                .on('change', (info) => {
                    console.log('Sync change:', info);
                    this.updateSyncStatus('syncing');
                })
                .on('paused', () => {
                    console.log('Sync paused');
                    this.updateSyncStatus('synced');
                })
                .on('active', () => {
                    console.log('Sync active');
                    this.updateSyncStatus('syncing');
                })
                .on('denied', (err) => {
                    console.error('Sync denied:', err);
                    this.updateSyncStatus('error');
                })
                .on('complete', (info) => {
                    console.log('Sync complete:', info);
                    this.updateSyncStatus('synced');
                })
                .on('error', (err) => {
                    console.error('Sync error:', err);
                    this.updateSyncStatus('error');
                });

            this.isSyncing = true;
            this.updateSyncStatus('connecting');
            return this.syncHandler;
        } catch (error) {
            console.error('Error setting up sync:', error);
            this.updateSyncStatus('error');
            return null;
        }
    }

    async syncNow() {
        if (!this.isSyncing) {
            return await this.setupCouchDBSync();
        }
        return this.syncHandler;
    }

    stopSync() {
        if (this.syncHandler) {
            this.syncHandler.cancel();
            this.syncHandler = null;
            this.isSyncing = false;
            this.updateSyncStatus('disconnected');
        }
    }

    // Helper method to convert GitHub URL to API URL
    convertToGitHubApiUrl(repoUrl) {
        try {
            // Remove .git suffix if present
            let cleanUrl = repoUrl.replace('.git', '');
            
            // Extract owner and repo name
            const match = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
            if (!match) {
                throw new Error('Invalid GitHub URL format');
            }
            
            const owner = match[1];
            const repo = match[2];
            
            return `https://api.github.com/repos/${owner}/${repo}`;
        } catch (error) {
            console.error('Error converting GitHub URL:', error);
            return null;
        }
    }

    // Token validation method
    async validateGitHubToken() {
        try {
            if (!this.gitRepoUrl || !this.gitToken) {
                return { valid: false, error: 'GitHub URL or token not configured' };
            }
            
            const apiUrl = this.convertToGitHubApiUrl(this.gitRepoUrl);
            if (!apiUrl) {
                return { valid: false, error: 'Invalid GitHub URL format' };
            }
            
            const response = await fetch(`${apiUrl}`, {
                headers: {
                    'Authorization': `Bearer ${this.gitToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const repoInfo = await response.json();
                return { 
                    valid: true, 
                    repoName: repoInfo.full_name,
                    permissions: repoInfo.permissions,
                    defaultBranch: repoInfo.default_branch || 'main'
                };
            } else {
                const errorData = await response.json().catch(() => ({}));
                return { 
                    valid: false, 
                    error: `GitHub API error: ${response.status} ${response.statusText} - ${errorData.message || ''}` 
                };
            }
        } catch (error) {
            return { 
                valid: false, 
                error: `Connection error: ${error.message}` 
            };
        }
    }

    // Git Backup Methods
    async setupGitBackup(gitRepoUrl, gitToken, backupIntervalMinutes = 30) {
        try {
            // Validate GitHub token first
            this.gitRepoUrl = gitRepoUrl;
            this.gitToken = gitToken;
            
            console.log('Validating GitHub token...');
            const validation = await this.validateGitHubToken();
            console.log('Validation result:', validation);
            
            if (!validation.valid) {
                throw new Error(`GitHub token validation failed: ${validation.error}`);
            }
            
            this.gitBackupEnabled = true;
            this.githubDefaultBranch = validation.defaultBranch;
            
            // Set up interval backup
            if (this.backupInterval) {
                clearInterval(this.backupInterval);
            }
            
            this.backupInterval = setInterval(() => {
                this.backupToGit();
            }, backupIntervalMinutes * 60 * 1000);
            
            console.log('Git backup configured successfully');
            this.showNotification(`Git backup configured for ${validation.repoName}`, 'success');
            return true;
        } catch (error) {
            console.error('Error setting up Git backup:', error);
            this.showNotification('Git backup setup failed: ' + error.message, 'error');
            return false;
        }
    }

    async backupToGit() {
        if (!this.gitBackupEnabled || !this.gitRepoUrl || !this.gitToken) {
            console.log('Git backup not enabled or configured');
            return;
        }
        
        try {
            this.updateSyncStatus('backup_started');
            console.log('Starting Git backup...');
            
            // 1. Export current database to JSON
            const allDocs = await schema.getAllDocs();
            const exportData = {
                export_date: new Date().toISOString(),
                schema_version: '1.0',
                documents: allDocs.filter(doc => !doc._id.startsWith('_design')),
                design_docs: allDocs.filter(doc => doc._id.startsWith('_design'))
            };
            
            console.log(`Exporting ${exportData.documents.length} documents...`);
            
            // 2. Convert GitHub repo URL to API URL
            const apiUrl = this.convertToGitHubApiUrl(this.gitRepoUrl);
            if (!apiUrl) {
                throw new Error('Invalid GitHub repository URL');
            }
            
            // 3. Upload to Git
            await this.uploadToGit(exportData, apiUrl);
            
            this.updateSyncStatus('backup_completed');
            this.showNotification('Backup completed successfully', 'success');
            console.log('Git backup completed successfully');
            
        } catch (error) {
            console.error('Error backing up to Git:', error);
            this.updateSyncStatus('backup_error');
            this.showNotification('Backup failed: ' + error.message, 'error');
        }
    }

    async checkGitForExistingBackup(apiUrl) {
        try {
            if (!apiUrl) {
                apiUrl = this.convertToGitHubApiUrl(this.gitRepoUrl);
            }
            
            if (!apiUrl) {
                return null;
            }
            
            console.log('Checking for existing backup...');
            const response = await fetch(`${apiUrl}/contents/database-backup.json`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.gitToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Found existing backup');
                const content = atob(data.content.replace(/\n/g, ''));
                return JSON.parse(content);
            } else if (response.status === 404) {
                console.log('No existing backup found (404)');
                return null; // File doesn't exist yet
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('GitHub API error:', response.status, errorData);
                // Don't throw error, just return null
                return null;
            }
        } catch (error) {
            console.log('Error checking Git for existing backup:', error.message);
            return null;
        }
    }

    async uploadToGit(data, apiUrl) {
        try {
            if (!apiUrl) {
                apiUrl = this.convertToGitHubApiUrl(this.gitRepoUrl);
            }
            
            if (!apiUrl) {
                throw new Error('Invalid GitHub repository URL');
            }
            
            const content = btoa(JSON.stringify(data, null, 2));
            const filename = 'database-backup.json';
            const commitMessage = `Database backup ${new Date().toISOString()}`;
            
            console.log('Uploading to GitHub...');
            console.log('API URL:', apiUrl);
            console.log('Filename:', filename);
            
            // First, check if file exists
            let sha = null;
            try {
                const fileCheck = await fetch(`${apiUrl}/contents/${filename}`, {
                    headers: {
                        'Authorization': `Bearer ${this.gitToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (fileCheck.ok) {
                    const fileData = await fileCheck.json();
                    sha = fileData.sha;
                    console.log('Found existing file, SHA:', sha);
                } else if (fileCheck.status === 404) {
                    console.log('File does not exist yet, will create new');
                } else {
                    console.error('Error checking file:', fileCheck.status);
                }
            } catch (error) {
                console.log('Error checking file, will try to create:', error.message);
            }
            
            const payload = {
                message: commitMessage,
                content: content,
                branch: this.githubDefaultBranch || 'main'
            };
            
            if (sha) {
                payload.sha = sha;
            }
            
            console.log('Upload payload prepared');
            
            const response = await fetch(`${apiUrl}/contents/${filename}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.gitToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(payload)
            });
            
            console.log('Upload response status:', response.status);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error('GitHub API error response:', errorData);
                
                let errorMessage = `Failed to upload to Git: ${response.status} ${response.statusText}`;
                if (errorData.message) {
                    errorMessage += ` - ${errorData.message}`;
                }
                
                // Provide more specific guidance based on error
                if (response.status === 403) {
                    errorMessage += '\n\nPossible issues:';
                    errorMessage += '\n1. Token might not have "repo" scope';
                    errorMessage += '\n2. Repository might be private and token needs access';
                    errorMessage += '\n3. Repository might not exist or you lack write permissions';
                } else if (response.status === 404) {
                    errorMessage += '\n\nPossible issues:';
                    errorMessage += '\n1. Repository might not exist';
                    errorMessage += '\n2. Incorrect repository URL';
                    errorMessage += '\n3. Repository might be private and token lacks access';
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            console.log('Backup uploaded to Git successfully:', result.content?.sha);
            
        } catch (error) {
            console.error('Error uploading to Git:', error);
            throw error;
        }
    }

    async downloadFromGit() {
        try {
            const apiUrl = this.convertToGitHubApiUrl(this.gitRepoUrl);
            if (!apiUrl) {
                throw new Error('Invalid GitHub repository URL');
            }
            
            const response = await fetch(`${apiUrl}/contents/database-backup.json`, {
                headers: {
                    'Authorization': `Bearer ${this.gitToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const content = atob(data.content.replace(/\n/g, ''));
                return JSON.parse(content);
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Failed to download backup: ${response.status} ${response.statusText} - ${errorData.message || ''}`);
        } catch (error) {
            console.error('Error downloading from Git:', error);
            throw error;
        }
    }

    async restoreFromGit() {
        try {
            this.updateSyncStatus('restore_started');
            
            // 1. Download backup from Git
            const backupData = await this.downloadFromGit();
            
            if (!backupData) {
                throw new Error('No backup found');
            }
            
            // 2. Clear existing database
            await schema.clearDatabase();
            
            // 3. Restore documents
            const allDocs = [
                ...backupData.design_docs,
                ...backupData.documents
            ];
            
            // 4. Import in batches to avoid memory issues
            const batchSize = 50;
            for (let i = 0; i < allDocs.length; i += batchSize) {
                const batch = allDocs.slice(i, i + batchSize);
                await db.bulkDocs(batch);
            }
            
            this.updateSyncStatus('restore_completed');
            this.showNotification('Restore completed successfully', 'success');
            
            // Reload the application
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Error restoring from Git:', error);
            this.updateSyncStatus('restore_error');
            this.showNotification('Restore failed: ' + error.message, 'error');
        }
    }

    async manualBackup() {
        console.log('Manual backup triggered');
        await this.backupToGit();
    }

    async manualRestore() {
        if (confirm('Are you sure you want to restore from Git backup? This will replace all local data.')) {
            await this.restoreFromGit();
        }
    }

    async testGitConnection() {
        try {
            if (!this.gitRepoUrl || !this.gitToken) {
                return { 
                    success: false, 
                    message: 'GitHub URL or token not configured' 
                };
            }
            
            console.log('Testing GitHub connection...');
            const validation = await this.validateGitHubToken();
            
            if (validation.valid) {
                return { 
                    success: true, 
                    message: `Connected to ${validation.repoName} successfully!`,
                    details: validation
                };
            } else {
                return { 
                    success: false, 
                    message: `Connection failed: ${validation.error}`,
                    details: validation
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: `Test failed: ${error.message}` 
            };
        }
    }

    // Status Management
    updateSyncStatus(status) {
        this.syncStatus = status;
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
            statusElement.textContent = this.getStatusText(status);
            statusElement.className = `badge bg-${this.getStatusColor(status)}`;
        }
        
        // Update UI with detailed status
        this.updateSyncDetails();
    }

    updateSyncDetails() {
        const detailsElement = document.getElementById('sync-details');
        if (detailsElement) {
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
            
            detailsElement.textContent = details[this.syncStatus] || '';
        }
    }

    getStatusText(status) {
        const statusMap = {
            'connecting': 'Connecting...',
            'syncing': 'Syncing...',
            'synced': 'Synced',
            'error': 'Error',
            'disconnected': 'Offline',
            'backup_started': 'Backup',
            'backup_completed': 'Backed Up',
            'backup_error': 'Backup Error',
            'restore_started': 'Restoring',
            'restore_completed': 'Restored',
            'restore_error': 'Restore Error'
        };
        return statusMap[status] || status;
    }

    getStatusColor(status) {
        const colorMap = {
            'connecting': 'warning',
            'syncing': 'info',
            'synced': 'success',
            'error': 'danger',
            'disconnected': 'secondary',
            'backup_started': 'info',
            'backup_completed': 'success',
            'backup_error': 'danger',
            'restore_started': 'warning',
            'restore_completed': 'success',
            'restore_error': 'danger'
        };
        return colorMap[status] || 'secondary';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        notification.style.cssText = `
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
        `;
        notification.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    // Export/Import Methods
    async exportToJSON() {
        try {
            const allDocs = await schema.getAllDocs();
            const exportData = {
                export_date: new Date().toISOString(),
                schema_version: '1.0',
                documents: allDocs.filter(doc => !doc._id.startsWith('_design')),
                design_docs: allDocs.filter(doc => doc._id.startsWith('_design'))
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `textile-erp-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.showNotification('Export completed successfully', 'success');
            return exportData;
            
        } catch (error) {
            console.error('Error exporting to JSON:', error);
            this.showNotification('Export failed: ' + error.message, 'error');
            throw error;
        }
    }

    async importFromJSON(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (event) => {
                try {
                    this.updateSyncStatus('restore_started');
                    
                    const importData = JSON.parse(event.target.result);
                    
                    // Validate import data
                    if (!importData.documents || !Array.isArray(importData.documents)) {
                        throw new Error('Invalid backup file format');
                    }
                    
                    // Import documents
                    const allDocs = [
                        ...(importData.design_docs || []),
                        ...importData.documents
                    ];
                    
                    // Import in batches
                    const batchSize = 50;
                    for (let i = 0; i < allDocs.length; i += batchSize) {
                        const batch = allDocs.slice(i, i + batchSize);
                        await db.bulkDocs(batch);
                    }
                    
                    this.updateSyncStatus('restore_completed');
                    this.showNotification('Import completed successfully', 'success');
                    
                    // Reload the application
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                    
                    resolve(true);
                    
                } catch (error) {
                    console.error('Error importing from JSON:', error);
                    this.updateSyncStatus('restore_error');
                    this.showNotification('Import failed: ' + error.message, 'error');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsText(file);
        });
    }

    // Cleanup
    destroy() {
        this.stopSync();
        
        if (this.backupInterval) {
            clearInterval(this.backupInterval);
            this.backupInterval = null;
        }
        
        if (this.remoteDB) {
            this.remoteDB.close();
        }
    }
}

// Initialize enhanced sync manager
const syncManager = new EnhancedSyncManager();
window.syncManager = syncManager;

// Add UI elements for sync controls
function addSyncControlsToUI() {
    // Create sync status panel
    const syncPanel = `
        <div class="sync-panel position-fixed" style="bottom: 20px; right: 20px; z-index: 1000;">
            <div class="card shadow-sm">
                <div class="card-body p-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="sync-status">
                            Status: 
                            <span id="sync-status" class="badge bg-secondary">Offline</span>
                        </span>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" onclick="syncManager.syncNow()" title="Sync Now">
                                <i class="bi bi-arrow-repeat"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-success" onclick="syncManager.manualBackup()" title="Backup to Git">
                                <i class="bi bi-cloud-upload"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-warning" onclick="syncManager.exportToJSON()" title="Export JSON">
                                <i class="bi bi-download"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="document.getElementById('import-file').click()" title="Import JSON">
                                <i class="bi bi-upload"></i>
                            </button>
                        </div>
                    </div>
                    <small id="sync-details" class="text-muted d-block mt-1"></small>
                </div>
            </div>
        </div>
        <input type="file" id="import-file" accept=".json" style="display: none;" 
               onchange="handleFileImport(event)">
    `;
    
    document.body.insertAdjacentHTML('beforeend', syncPanel);
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (confirm('Import will replace all current data. Continue?')) {
        syncManager.importFromJSON(file);
    }
    
    // Reset file input
    event.target.value = '';
}

// Add sync controls after page loads
document.addEventListener('DOMContentLoaded', addSyncControlsToUI);

// Auto-start sync if configured
const enableAutoSync = localStorage.getItem('enableAutoSync') !== 'false';
if (enableAutoSync) {
    setTimeout(() => {
        syncManager.setupCouchDBSync();
    }, 3000);
}

// Add Git configuration function
window.configureGitBackup = function(repoUrl, token, intervalMinutes = 30) {
    return syncManager.setupGitBackup(repoUrl, token, intervalMinutes);
};