// Sync Manager
class SyncManager {
    constructor() {
        this.remoteDB = null;
        this.syncHandler = null;
        this.isSyncing = false;
        this.syncStatus = 'disconnected';

        this.initRemoteDB();
        this.setupNetworkListeners();
    }

    initRemoteDB() {
        try {
            this.remoteDB = new PouchDB(REMOTE_COUCHDB, {
                skip_setup: false
            });
        } catch (error) {
            console.error('Error initializing remote DB:', error);
        }
    }

    /**
     * FULL AUTO SYNC
     * 1️⃣ Pull full DB
     * 2️⃣ Push local changes
     * 3️⃣ Start live sync
     */
    async setupSync() {
        if (!this.remoteDB) return null;

        try {
            // Cancel previous sync
            if (this.syncHandler) {
                this.syncHandler.cancel();
            }

            this.updateSyncStatus('connecting');

            // 1️⃣ Initial FULL PULL (Remote → Local)
            await db.replicate.from(this.remoteDB);
            console.log('✅ Initial pull completed');

            // 2️⃣ Initial FULL PUSH (Local → Remote)
            await db.replicate.to(this.remoteDB);
            console.log('✅ Initial push completed');

            // 3️⃣ Live two-way sync
            this.syncHandler = db.sync(this.remoteDB, {
                live: true,
                retry: true
            });

            this.syncHandler
                .on('change', () => this.updateSyncStatus('syncing'))
                .on('paused', () => {
                    if (navigator.onLine) {
                        this.updateSyncStatus('synced');
                    } else {
                        this.updateSyncStatus('disconnected');
                    }
                })
                .on('active', () => this.updateSyncStatus('syncing'))
                .on('error', (err) => {
                    console.error('Sync error:', err);
                    this.updateSyncStatus('error');
                });

            this.isSyncing = true;
            this.updateSyncStatus('synced');

            return this.syncHandler;
        } catch (error) {
            console.error('Error setting up sync:', error);
            this.updateSyncStatus('error');
            return null;
        }
    }

    /**
     * Manual sync button support
     */
    async syncNow() {
        return await this.setupSync();
    }

    /**
     * Detect online / offline
     */
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Online');
            this.setupSync();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Offline');
            this.updateSyncStatus('disconnected');
        });
    }

    /**
     * UI helpers
     */
    updateSyncStatus(status) {
        this.syncStatus = status;
        const statusElement = document.getElementById('sync-status');

        if (statusElement) {
            statusElement.textContent = this.getStatusText(status);
            statusElement.className = `badge bg-${this.getStatusColor(status)}`;
        }
    }

    getStatusText(status) {
        return {
            connecting: 'Connecting...',
            syncing: 'Syncing...',
            synced: 'Synced',
            error: 'Sync Error',
            disconnected: 'Offline'
        }[status] || status;
    }

    getStatusColor(status) {
        return {
            connecting: 'warning',
            syncing: 'info',
            synced: 'success',
            error: 'danger',
            disconnected: 'secondary'
        }[status] || 'secondary';
    }
}

// Initialize sync manager
const syncManager = new SyncManager();
window.syncManager = syncManager;
