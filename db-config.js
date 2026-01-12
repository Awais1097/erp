// db-config.js
const DB_NAME = 'textile-erp';
const REMOTE_COUCHDB = 'http://admin:password@localhost:5984/textile-erp'; // Your CouchDB URL

// Initialize PouchDB
const db = new PouchDB(DB_NAME);

// Database Schema Manager
class TextileERPSchema {
    constructor() {
        this.initDesignDocs();
    }

    async initDesignDocs() {
        // Create design documents for views
        const designDoc = {
            _id: '_design/erp',
            views: {
                // Account views
                'accounts_by_type': {
                    map: function(doc) {
                        if (doc.type === 'account') {
                            emit([doc.account_type, doc.account_name], {
                                _id: doc._id,
                                account_name: doc.account_name,
                                account_type: doc.account_type,
                                status: doc.status
                            });
                        }
                    }.toString()
                },
                
                // Lot views
                'lots_by_stage': {
                    map: function(doc) {
                        if (doc.type === 'lot') {
                            emit([doc.current_stage, doc.status], {
                                _id: doc._id,
                                lot_number: doc.lot_number,
                                current_stage: doc.current_stage,
                                current_qty: doc.current_qty,
                                uom: doc.uom,
                                status: doc.status
                            });
                        }
                    }.toString()
                },
                
                // Stock movement views
                'stock_by_lot': {
                    map: function(doc) {
                        if (doc.type === 'stock_movement') {
                            emit([doc.lot_id, doc.movement_date], {
                                _id: doc._id,
                                lot_id: doc.lot_id,
                                from_stage: doc.from_stage,
                                to_stage: doc.to_stage,
                                qty: doc.qty,
                                movement_date: doc.movement_date
                            });
                        }
                    }.toString()
                },
                
                // Voucher views
                'vouchers_by_date': {
                    map: function(doc) {
                        if (doc.type === 'voucher') {
                            emit(doc.voucher_date, {
                                _id: doc._id,
                                voucher_type: doc.voucher_type,
                                voucher_number: doc.voucher_number,
                                voucher_date: doc.voucher_date,
                                total_amount: doc.total_amount
                            });
                        }
                    }.toString()
                },
                
                // Products by category
                'products_by_category': {
                    map: function(doc) {
                        if (doc.type === 'product') {
                            emit(doc.category, {
                                _id: doc._id,
                                product_name: doc.product_name,
                                category: doc.category,
                                uom: doc.uom
                            });
                        }
                    }.toString()
                }
            },
            filters: {
                'by_type': function(doc, req) {
                    if (doc.type && req.query.type) {
                        return doc.type === req.query.type;
                    }
                    return true;
                }.toString()
            }
        };

        try {
            // Try to get existing design doc
            const existingDoc = await db.get('_design/erp').catch(() => null);
            if (existingDoc) {
                designDoc._rev = existingDoc._rev;
            }
            await db.put(designDoc);
            console.log('Design documents created/updated');
        } catch (e) {
            console.log('Error creating design docs:', e);
        }
    }

    // Common CRUD operations
    async createDoc(type, data) {
        const timestamp = new Date().toISOString();
        const doc = {
            ...data,
            type: type,
            created_at: timestamp,
            updated_at: timestamp,
            _id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
        
        try {
            const response = await db.put(doc);
            return { ...doc, _rev: response.rev };
        } catch (error) {
            console.error('Error creating document:', error);
            throw error;
        }
    }

    async updateDoc(doc) {
        doc.updated_at = new Date().toISOString();
        try {
            const response = await db.put(doc);
            return { ...doc, _rev: response.rev };
        } catch (error) {
            console.error('Error updating document:', error);
            throw error;
        }
    }

    async deleteDoc(doc) {
        try {
            const response = await db.remove(doc);
            return response;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }

    async findDocs(type, options = {}) {
        try {
            const result = await db.allDocs({
                include_docs: true,
                startkey: `${type}_`,
                endkey: `${type}_\uffff`
            });
            
            return result.rows
                .map(row => row.doc)
                .filter(doc => !doc._id.startsWith('_design'));
        } catch (error) {
            console.error('Error finding documents:', error);
            return [];
        }
    }

    async queryView(viewName, options = {}) {
        try {
            const result = await db.query(`_design/erp/_view/${viewName}`, {
                include_docs: true,
                ...options
            });
            return result.rows.map(row => row.doc || row.value);
        } catch (error) {
            console.error('Error querying view:', error);
            return [];
        }
    }

    async getDoc(id) {
        try {
            return await db.get(id);
        } catch (error) {
            console.error('Error getting document:', error);
            return null;
        }
    }

    // Bulk operations
    async bulkDocs(docs) {
        try {
            const response = await db.bulkDocs(docs);
            return response;
        } catch (error) {
            console.error('Error in bulk operation:', error);
            throw error;
        }
    }

    // Get database info
    async getInfo() {
        try {
            return await db.info();
        } catch (error) {
            console.error('Error getting DB info:', error);
            return null;
        }
    }

    // Clear local database (for testing/reset)
    async clearDatabase() {
        try {
            await db.destroy();
            window.location.reload();
        } catch (error) {
            console.error('Error clearing database:', error);
            throw error;
        }
    }
}

// Initialize schema
const schema = new TextileERPSchema();

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
            console.log('Remote database initialized:', REMOTE_COUCHDB);
        } catch (error) {
            console.error('Error initializing remote database:', error);
        }
    }

    async setupSync() {
        if (!this.remoteDB) {
            console.error('Remote database not initialized');
            return null;
        }

        try {
            // Cancel existing sync if any
            if (this.syncHandler) {
                this.syncHandler.cancel();
            }

            // Setup two-way sync
            this.syncHandler = db.sync(this.remoteDB, {
                live: true,
                retry: true,
                back_off_function: (delay) => {
                    if (delay === 0) {
                        return 1000;
                    }
                    return delay * 3;
                }
            });

            // Setup event handlers
            this.syncHandler
                .on('change', (info) => {
                    console.log('Sync change:', info);
                    this.updateSyncStatus('syncing');
                    this.showSyncNotification(`Syncing ${info.direction} ${info.change.docs.length} documents`);
                })
                .on('paused', (info) => {
                    console.log('Sync paused:', info);
                    this.updateSyncStatus('synced');
                    this.showSyncNotification('Sync completed', 'success');
                })
                .on('active', () => {
                    console.log('Sync active');
                    this.updateSyncStatus('syncing');
                })
                .on('error', (err) => {
                    console.error('Sync error:', err);
                    this.updateSyncStatus('error');
                    this.showSyncNotification('Sync error: ' + err.message, 'danger');
                })
                .on('complete', (info) => {
                    console.log('Sync complete:', info);
                    this.updateSyncStatus('synced');
                    this.showSyncNotification('Sync complete', 'success');
                })
                .on('denied', (err) => {
                    console.error('Sync denied:', err);
                    this.updateSyncStatus('error');
                    this.showSyncNotification('Sync denied: ' + err.message, 'danger');
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

    stopSync() {
        if (this.syncHandler) {
            this.syncHandler.cancel();
            this.syncHandler = null;
            this.isSyncing = false;
            this.updateSyncStatus('disconnected');
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

    showSyncNotification(message, type = 'info') {
        // Create notification toast
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi bi-cloud-${type === 'success' ? 'check' : 'slash'} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        
        const container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        container.appendChild(toast);
        document.body.appendChild(container);
        
        const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            container.remove();
        });
    }

    async syncNow() {
        if (!this.isSyncing) {
            return await this.setupSync();
        }
        return this.syncHandler;
    }

    async getSyncInfo() {
        if (!this.syncHandler) return null;
        
        try {
            const info = await db.info();
            const remoteInfo = await this.remoteDB.info();
            
            return {
                local: {
                    db_name: info.db_name,
                    doc_count: info.doc_count,
                    update_seq: info.update_seq
                },
                remote: {
                    db_name: remoteInfo.db_name,
                    doc_count: remoteInfo.doc_count,
                    update_seq: remoteInfo.update_seq
                },
                status: this.syncStatus
            };
        } catch (error) {
            console.error('Error getting sync info:', error);
            return null;
        }
    }

    // Replicate from remote to local (one-time)
    async pullFromRemote() {
        if (!this.remoteDB) return;
        
        try {
            this.showSyncNotification('Pulling data from server...', 'info');
            await db.replicate.from(this.remoteDB);
            this.showSyncNotification('Data pulled successfully', 'success');
        } catch (error) {
            console.error('Error pulling from remote:', error);
            this.showSyncNotification('Error pulling data: ' + error.message, 'danger');
        }
    }

    // Replicate from local to remote (one-time)
    async pushToRemote() {
        if (!this.remoteDB) return;
        
        try {
            this.showSyncNotification('Pushing data to server...', 'info');
            await db.replicate.to(this.remoteDB);
            this.showSyncNotification('Data pushed successfully', 'success');
        } catch (error) {
            console.error('Error pushing to remote:', error);
            this.showSyncNotification('Error pushing data: ' + error.message, 'danger');
        }
    }
}

// Initialize sync manager
const syncManager = new SyncManager();

// Export for global access
window.schema = schema;
window.syncManager = syncManager;
window.db = db;
