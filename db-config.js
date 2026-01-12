// db-config.js
const DB_NAME = 'textile-erp';
const REMOTE_COUCHDB = 'http://admin:password@localhost:5984/';

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
                            emit([doc.account_type, doc.account_name], doc);
                        }
                    }.toString()
                },
                
                // Lot views
                'lots_by_stage': {
                    map: function(doc) {
                        if (doc.type === 'lot') {
                            emit([doc.current_stage, doc.status], doc);
                        }
                    }.toString()
                },
                
                // Stock movement views
                'stock_by_lot': {
                    map: function(doc) {
                        if (doc.type === 'stock_movement') {
                            emit([doc.lot_id, doc.movement_date], doc);
                        }
                    }.toString()
                },
                
                // Voucher views
                'vouchers_by_date': {
                    map: function(doc) {
                        if (doc.type === 'voucher') {
                            emit(doc.voucher_date, doc);
                        }
                    }.toString()
                }
            }
        };

        try {
            await db.put(designDoc);
        } catch (e) {
            // Design doc might already exist
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
        
        const response = await db.put(doc);
        return { ...doc, _rev: response.rev };
    }

    async updateDoc(doc) {
        doc.updated_at = new Date().toISOString();
        return await db.put(doc);
    }

    async deleteDoc(doc) {
        return await db.remove(doc);
    }

    async findDocs(type, options = {}) {
        const result = await db.allDocs({
            include_docs: true,
            startkey: `${type}_`,
            endkey: `${type}_\uffff`
        });
        
        return result.rows.map(row => row.doc);
    }
}

// Initialize schema
const schema = new TextileERPSchema();

// Sync with CouchDB
function setupSync() {
    const sync = db.sync(REMOTE_COUCHDB, {
        live: true,
        retry: true
    });
    
    sync.on('change', function(change) {
        console.log('Sync change:', change);
    }).on('error', function(err) {
        console.log('Sync error:', err);
    });
    
    return sync;
}