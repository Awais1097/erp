// Sync Manager
class SyncManager {
    constructor() {
        this.remoteDB = null;
        this.syncHandler = null;
        this.isSyncing = false;
        this.syncStatus = 'disconnected';
        this.initRemoteDB();
    }

    initRemoteDB() {
        try {
            this.remoteDB = new PouchDB(REMOTE_COUCHDB);
        } catch (error) {
            console.error('Error initializing remote DB:', error);
        }
    }

    async setupSync() {
        if (!this.remoteDB) return null;

        try {
            if (this.syncHandler) {
                this.syncHandler.cancel();
            }

            this.syncHandler = db.sync(this.remoteDB, {
                live: true,
                retry: true
            });

            this.syncHandler
                .on('change', () => this.updateSyncStatus('syncing'))
                .on('paused', () => this.updateSyncStatus('synced'))
                .on('error', () => this.updateSyncStatus('error'));

            this.isSyncing = true;
            this.updateSyncStatus('connecting');
            return this.syncHandler;
        } catch (error) {
            console.error('Error setting up sync:', error);
            this.updateSyncStatus('error');
            return null;
        }
    }

    updateSyncStatus(status) {
        this.syncStatus = status;
        const statusElement = document.getElementById('sync-status');
        if (statusElement) {
            statusElement.textContent = this.getStatusText(status);
            statusElement.className = `badge bg-${this.getStatusColor(status)}`;
        }
    }

    getStatusText(status) {
        const statusMap = {
            'connecting': 'Connecting...',
            'syncing': 'Syncing...',
            'synced': 'Synced',
            'error': 'Error',
            'disconnected': 'Offline'
        };
        return statusMap[status] || status;
    }

    getStatusColor(status) {
        const colorMap = {
            'connecting': 'warning',
            'syncing': 'info',
            'synced': 'success',
            'error': 'danger',
            'disconnected': 'secondary'
        };
        return colorMap[status] || 'secondary';
    }

    async syncNow() {
        if (!this.isSyncing) {
            return await this.setupSync();
        }
        return this.syncHandler;
    }
}

// Initialize sync manager
const syncManager = new SyncManager();
window.syncManager = syncManager;