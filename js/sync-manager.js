// // Sync Manager
// class SyncManager {
//     constructor() {
//         this.remoteDB = null;
//         this.syncHandler = null;
//         this.isSyncing = false;
//         this.syncStatus = 'disconnected';
//         this.initRemoteDB();
//     }

//     initRemoteDB() {
//         try {
//             this.remoteDB = new PouchDB(REMOTE_COUCHDB);
//         } catch (error) {
//             console.error('Error initializing remote DB:', error);
//         }
//     }

//     async setupSync() {
//         if (!this.remoteDB) return null;

//         try {
//             if (this.syncHandler) {
//                 this.syncHandler.cancel();
//             }

//             this.syncHandler = db.sync(this.remoteDB, {
//                 live: true,
//                 retry: true
//             });

//             this.syncHandler
//                 .on('change', () => this.updateSyncStatus('syncing'))
//                 .on('paused', () => this.updateSyncStatus('synced'))
//                 .on('error', () => this.updateSyncStatus('error'));

//             this.isSyncing = true;
//             this.updateSyncStatus('connecting');
//             return this.syncHandler;
//         } catch (error) {
//             console.error('Error setting up sync:', error);
//             this.updateSyncStatus('error');
//             return null;
//         }
//     }

//     updateSyncStatus(status) {
//         this.syncStatus = status;
//         const statusElement = document.getElementById('sync-status');
//         if (statusElement) {
//             statusElement.textContent = this.getStatusText(status);
//             statusElement.className = `badge bg-${this.getStatusColor(status)}`;
//         }
//     }

//     getStatusText(status) {
//         const statusMap = {
//             'connecting': 'Connecting...',
//             'syncing': 'Syncing...',
//             'synced': 'Synced',
//             'error': 'Error',
//             'disconnected': 'Offline'
//         };
//         return statusMap[status] || status;
//     }

//     getStatusColor(status) {
//         const colorMap = {
//             'connecting': 'warning',
//             'syncing': 'info',
//             'synced': 'success',
//             'error': 'danger',
//             'disconnected': 'secondary'
//         };
//         return colorMap[status] || 'secondary';
//     }

//     async syncNow() {
//         if (!this.isSyncing) {
//             return await this.setupSync();
//         }
//         return this.syncHandler;
//     }
// }

// // Initialize sync manager
// const syncManager = new SyncManager();
// window.syncManager = syncManager;

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

    // Git Backup Methods
    async setupGitBackup(gitRepoUrl, gitToken, backupIntervalMinutes = 30) {
        try {
            this.gitRepoUrl = gitRepoUrl;
            this.gitToken = gitToken;
            this.gitBackupEnabled = true;
            
            // Create backup directory if it doesn't exist
            if (!localStorage.getItem('gitBackupPath')) {
                const backupPath = `textile-erp-backup-${Date.now()}`;
                localStorage.setItem('gitBackupPath', backupPath);
            }
            
            // Set up interval backup
            this.backupInterval = setInterval(() => {
                this.backupToGit();
            }, backupIntervalMinutes * 60 * 1000);
            
            // Initial backup
            await this.backupToGit();
            
            console.log('Git backup configured');
            return true;
        } catch (error) {
            console.error('Error setting up Git backup:', error);
            return false;
        }
    }

    async backupToGit() {
        if (!this.gitBackupEnabled || !this.gitRepoUrl) return;
        
        try {
            this.updateSyncStatus('backup_started');
            
            // 1. Export current database to JSON
            const allDocs = await schema.getAllDocs();
            const exportData = {
                export_date: new Date().toISOString(),
                schema_version: '1.0',
                documents: allDocs.filter(doc => !doc._id.startsWith('_design')),
                design_docs: allDocs.filter(doc => doc._id.startsWith('_design'))
            };
            
            // 2. Check if Git repo already has backup
            const existingBackup = await this.checkGitForExistingBackup();
            
            if (existingBackup) {
                // 3. Merge changes if backup exists
                await this.mergeAndUpload(exportData, existingBackup);
            } else {
                // 4. Upload initial backup
                await this.uploadToGit(exportData);
            }
            
            this.updateSyncStatus('backup_completed');
            this.showNotification('Backup completed successfully', 'success');
            
        } catch (error) {
            console.error('Error backing up to Git:', error);
            this.updateSyncStatus('backup_error');
            this.showNotification('Backup failed: ' + error.message, 'error');
        }
    }

    async checkGitForExistingBackup() {
        try {
            // In a real implementation, you would use GitHub API
            // This is a simplified version
            const response = await fetch(`${this.gitRepoUrl}/contents/database-backup.json`, {
                headers: {
                    'Authorization': `token ${this.gitToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const content = atob(data.content);
                return JSON.parse(content);
            }
            return null;
        } catch (error) {
            console.log('No existing backup found or error:', error);
            return null;
        }
    }

    async mergeAndUpload(currentData, existingBackup) {
        try {
            // Create merged data
            const mergedData = {
                ...currentData,
                documents: this.mergeDocuments(currentData.documents, existingBackup.documents),
                previous_backup_date: existingBackup.export_date
            };
            
            await this.uploadToGit(mergedData);
            
        } catch (error) {
            console.error('Error merging data:', error);
            throw error;
        }
    }

    mergeDocuments(currentDocs, existingDocs) {
        // Create a map of existing docs by _id
        const existingMap = {};
        existingDocs.forEach(doc => {
            existingMap[doc._id] = doc;
        });
        
        // Merge with current docs
        const mergedDocs = [...existingDocs];
        
        currentDocs.forEach(currentDoc => {
            const existingDoc = existingMap[currentDoc._id];
            
            if (!existingDoc) {
                // New document
                mergedDocs.push(currentDoc);
            } else if (new Date(currentDoc.updated_at) > new Date(existingDoc.updated_at)) {
                // Current document is newer, replace
                const index = mergedDocs.findIndex(doc => doc._id === currentDoc._id);
                if (index !== -1) {
                    mergedDocs[index] = currentDoc;
                }
            }
        });
        
        return mergedDocs;
    }

    async uploadToGit(data) {
        try {
            const content = btoa(JSON.stringify(data, null, 2));
            const filename = `database-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            const payload = {
                message: `Database backup ${new Date().toISOString()}`,
                content: content,
                branch: 'main'
            };
            
            // Check if file exists to update or create
            const existingFile = await this.checkGitForExistingBackup();
            if (existingFile) {
                // Get SHA of existing file
                const fileInfo = await fetch(`${this.gitRepoUrl}/contents/database-backup.json`, {
                    headers: {
                        'Authorization': `token ${this.gitToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                });
                
                if (fileInfo.ok) {
                    const fileData = await fileInfo.json();
                    payload.sha = fileData.sha;
                }
            }
            
            const response = await fetch(`${this.gitRepoUrl}/contents/database-backup.json`, {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.gitToken}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.github.v3+json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error('Failed to upload to Git');
            }
            
            console.log('Backup uploaded to Git');
            
        } catch (error) {
            console.error('Error uploading to Git:', error);
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

    async downloadFromGit() {
        try {
            const response = await fetch(`${this.gitRepoUrl}/contents/database-backup.json`, {
                headers: {
                    'Authorization': `token ${this.gitToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                const content = atob(data.content);
                return JSON.parse(content);
            }
            throw new Error('Failed to download backup');
        } catch (error) {
            console.error('Error downloading from Git:', error);
            throw error;
        }
    }

    async manualBackup() {
        await this.backupToGit();
    }

    async manualRestore() {
        if (confirm('Are you sure you want to restore from Git backup? This will replace all local data.')) {
            await this.restoreFromGit();
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
    syncManager.setupGitBackup(repoUrl, token, intervalMinutes);
};

// Add configuration UI function
window.showSyncConfig = function() {
    const currentRepo = localStorage.getItem('gitRepoUrl') || '';
    const currentToken = localStorage.getItem('gitToken') || '';
    const interval = localStorage.getItem('backupInterval') || '30';
    
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