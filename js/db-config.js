// Database Configuration
const DB_NAME = 'textile-erp';
const REMOTE_COUCHDB = 'http://admin:admin123@localhost:5984/textile-erp';

// Initialize PouchDB
const db = new PouchDB(DB_NAME);

// Database Schema Manager
class TextileERPSchema {
    constructor() {
        this.initialized = false;
        this.initPromise = this.initDesignDocs();
    }

    async initDesignDocs() {
        if (this.initialized) return;
        
        const designDoc = {
            _id: '_design/erp',
            views: {
                // User views
                'users_by_username': {
                    map: function(doc) {
                        if (doc.type === 'user') {
                            emit(doc.username, {
                                _id: doc._id,
                                username: doc.username,
                                name: doc.name,
                                role: doc.role,
                                status: doc.status
                            });
                        }
                    }.toString()
                },
                
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
                
                // Product views
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
                },
                
                // Purchase views
                'purchases_by_status': {
                    map: function(doc) {
                        if (doc.type === 'purchase') {
                            emit([doc.status, doc.purchase_date], {
                                _id: doc._id,
                                purchase_number: doc.purchase_number,
                                supplier_account_id: doc.supplier_account_id,
                                total_amount: doc.total_amount,
                                status: doc.status
                            });
                        }
                    }.toString()
                },
                
                // Process orders views
                'process_orders_by_type': {
                    map: function(doc) {
                        if (doc.type === 'process_order') {
                            emit([doc.process_type, doc.status, doc.process_date], {
                                _id: doc._id,
                                process_number: doc.process_number,
                                process_type: doc.process_type,
                                lot_id: doc.lot_id,
                                status: doc.status,
                                total_cost: doc.total_cost
                            });
                        }
                    }.toString()
                },
                
                // Sales views
                'sales_by_buyer': {
                    map: function(doc) {
                        if (doc.type === 'sale') {
                            emit([doc.buyer_account_id, doc.sale_date], {
                                _id: doc._id,
                                invoice_number: doc.invoice_number,
                                total_amount: doc.total_amount,
                                status: doc.status
                            });
                        }
                    }.toString()
                },
                
                // Voucher views
                'vouchers_by_type': {
                    map: function(doc) {
                        if (doc.type === 'voucher') {
                            emit([doc.voucher_type, doc.voucher_date], {
                                _id: doc._id,
                                voucher_number: doc.voucher_number,
                                total_amount: doc.total_amount,
                                created_by: doc.created_by
                            });
                        }
                    }.toString()
                },
                
                // Lot costs views
                'lot_costs_by_type': {
                    map: function(doc) {
                        if (doc.type === 'lot_cost') {
                            emit([doc.lot_id, doc.cost_type], {
                                _id: doc._id,
                                cost_type: doc.cost_type,
                                total_cost: doc.total_cost
                            });
                        }
                    }.toString()
                },
                
                // Stock movements views
                'stock_movements_by_lot': {
                    map: function(doc) {
                        if (doc.type === 'stock_movement') {
                            emit([doc.lot_id, doc.movement_date], {
                                _id: doc._id,
                                from_stage: doc.from_stage,
                                to_stage: doc.to_stage,
                                qty: doc.qty,
                                reference_type: doc.reference_type
                            });
                        }
                    }.toString()
                },
                
                // Gray reject views
                'gray_rejects_by_status': {
                    map: function(doc) {
                        if (doc.type === 'gray_reject') {
                            emit([doc.status, doc.reject_date], {
                                _id: doc._id,
                                reject_number: doc.reject_number,
                                purchase_id: doc.purchase_id,
                                rejected_qty: doc.rejected_qty,
                                status: doc.status
                            });
                        }
                    }.toString()
                },
                
                // Employee views
                'employees_by_status': {
                    map: function(doc) {
                        if (doc.type === 'employee') {
                            emit([doc.status, doc.department], {
                                _id: doc._id,
                                employee_name: doc.employee_name,
                                department: doc.department,
                                status: doc.status
                            });
                        }
                    }.toString()
                },
                
                // Salary views
                'salaries_by_month': {
                    map: function(doc) {
                        if (doc.type === 'salary') {
                            emit([doc.employee_id, doc.month], {
                                _id: doc._id,
                                employee_id: doc.employee_id,
                                month: doc.month,
                                amount: doc.amount,
                                status: doc.status
                            });
                        }
                    }.toString()
                },
                
                // Settings views
                'settings_by_type': {
                    map: function(doc) {
                        if (doc.type === 'setting') {
                            emit(doc.setting_type || 'general', {
                                _id: doc._id,
                                setting_type: doc.setting_type,
                                updated_at: doc.updated_at
                            });
                        }
                    }.toString()
                }
            }
        };

        try {
            // Try to get existing design doc
            try {
                const existingDoc = await db.get('_design/erp');
                designDoc._rev = existingDoc._rev;
            } catch (e) {
                // Design doc doesn't exist yet, that's fine
                console.log('Creating new design document');
            }
            
            await db.put(designDoc);
            console.log('Design document created/updated successfully');
            this.initialized = true;
        } catch (error) {
            console.error('Error creating design document:', error);
            // Continue anyway - views might not work but basic operations will
        }
    }

    // Wait for initialization
    async waitForInit() {
        await this.initPromise;
    }

    // CRUD Operations
    async createDoc(type, data) {
        await this.waitForInit();
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
        await this.waitForInit();
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
        await this.waitForInit();
        try {
            const response = await db.remove(doc);
            return response;
        } catch (error) {
            console.error('Error deleting document:', error);
            throw error;
        }
    }

    async findDocs(type, options = {}) {
        await this.waitForInit();
        try {
            const result = await db.allDocs({
                include_docs: true,
                startkey: `${type}_`,
                endkey: `${type}_\uffff`
            });
            
            return result.rows
                .map(row => row.doc)
                .filter(doc => doc && !doc._id.startsWith('_design'));
        } catch (error) {
            console.error('Error finding documents:', error);
            return [];
        }
    }

    async getDoc(id) {
        await this.waitForInit();
        try {
            return await db.get(id);
        } catch (error) {
            console.error('Error getting document:', error);
            return null;
        }
    }

    async queryView(viewName, options = {}) {
        await this.waitForInit();
        try {
            const result = await db.query(`_design/erp/_view/${viewName}`, {
                include_docs: true,
                ...options
            });
            return result.rows.map(row => row.doc || row.value);
        } catch (error) {
            console.error(`Error querying view ${viewName}:`, error);
            
            // Fallback: If view doesn't exist, try to find docs manually
            if (viewName === 'users_by_username' && options.key) {
                const users = await this.findDocs('user');
                return users.filter(user => user.username === options.key);
            }
            
            return [];
        }
    }

    async getAllDocs() {
        await this.waitForInit();
        try {
            const result = await db.allDocs({
                include_docs: true
            });
            return result.rows.map(row => row.doc);
        } catch (error) {
            console.error('Error getting all docs:', error);
            return [];
        }
    }

    async bulkDocs(docs) {
        await this.waitForInit();
        try {
            const response = await db.bulkDocs(docs);
            return response;
        } catch (error) {
            console.error('Error in bulk operation:', error);
            throw error;
        }
    }

    async clearDatabase() {
        try {
            await db.destroy();
            console.log('Database cleared');
            location.reload();
        } catch (error) {
            console.error('Error clearing database:', error);
            throw error;
        }
    }
}

// Initialize schema
const schema = new TextileERPSchema();

// Export for use in other modules
window.schema = schema;
window.db = db;

// Initialize setup data
async function initializeDatabase() {
    try {
        await schema.waitForInit();
        
        // Check if we need to create admin user
        const users = await schema.findDocs('user');
        if (users.length === 0) {
            console.log('Creating initial admin user...');
            
            const adminUser = {
                type: 'user',
                username: 'admin',
                password: 'admin123', // In production, use proper hashing
                name: 'Administrator',
                email: 'admin@textileerp.com',
                role: 'admin',
                status: 'active',
                created_by: 'system',
                permissions: ['dashboard', 'inventory', 'purchase', 'dying', 'packing', 'sales', 'accounts', 'vouchers', 'reports', 'settings', 'users']
            };
            
            await schema.createDoc('user', adminUser);
            
            // Create manager user
            const managerUser = {
                type: 'user',
                username: 'manager',
                password: 'manager123',
                name: 'Manager',
                email: 'manager@textileerp.com',
                role: 'manager',
                status: 'active',
                created_by: 'system',
                permissions: ['dashboard', 'inventory', 'purchase', 'dying', 'packing', 'sales', 'accounts', 'vouchers', 'reports']
            };
            
            await schema.createDoc('user', managerUser);
            
            // Create regular user
            const regularUser = {
                type: 'user',
                username: 'user',
                password: 'user123',
                name: 'Regular User',
                email: 'user@textileerp.com',
                role: 'user',
                status: 'active',
                created_by: 'system',
                permissions: ['dashboard', 'inventory', 'purchase', 'dying', 'packing', 'sales']
            };
            
            await schema.createDoc('user', regularUser);
            
            // Create sample products
            const products = [
                {
                    type: 'product',
                    product_name: 'Cotton Gray Cloth',
                    category: 'gray',
                    uom: 'meter',
                    status: 'active',
                    description: 'Raw cotton cloth for dyeing'
                },
                {
                    type: 'product',
                    product_name: 'Polyester Gray Cloth',
                    category: 'gray',
                    uom: 'meter',
                    status: 'active',
                    description: 'Raw polyester cloth for dyeing'
                },
                {
                    type: 'product',
                    product_name: 'Dyed Cotton Fabric',
                    category: 'dyed',
                    uom: 'meter',
                    status: 'active',
                    description: 'Cotton fabric after dyeing process'
                },
                {
                    type: 'product',
                    product_name: 'Dyed Polyester Fabric',
                    category: 'dyed',
                    uom: 'meter',
                    status: 'active',
                    description: 'Polyester fabric after dyeing process'
                },
                {
                    type: 'product',
                    product_name: 'Packed Cotton Fabric',
                    category: 'finished',
                    uom: 'bag',
                    status: 'active',
                    description: 'Final packed cotton fabric ready for sale'
                },
                {
                    type: 'product',
                    product_name: 'Packed Polyester Fabric',
                    category: 'finished',
                    uom: 'bag',
                    status: 'active',
                    description: 'Final packed polyester fabric ready for sale'
                }
            ];
            
            for (const product of products) {
                await schema.createDoc('product', product);
            }
            
            // Create sample accounts
            const accounts = [
                // Assets
                {
                    type: 'account',
                    account_name: 'Cash in Hand',
                    account_type: 'asset',
                    account_code: 'ACC-001',
                    opening_balance: 100000,
                    opening_type: 'DR',
                    level: 1,
                    status: 'active',
                    description: 'Physical cash available'
                },
                {
                    type: 'account',
                    account_name: 'Bank Account',
                    account_type: 'asset',
                    account_code: 'ACC-002',
                    opening_balance: 500000,
                    opening_type: 'DR',
                    level: 1,
                    status: 'active',
                    description: 'Primary bank account'
                },
                // Suppliers
                {
                    type: 'account',
                    account_name: 'Gray Cloth Suppliers',
                    account_type: 'supplier',
                    account_code: 'ACC-003',
                    opening_balance: 0,
                    opening_type: 'CR',
                    level: 1,
                    status: 'active',
                    description: 'Suppliers of raw gray cloth',
                    contact_details: 'Suppliers Association\nPhone: 9876543210'
                },
                // Buyers
                {
                    type: 'account',
                    account_name: 'Fabric Buyers',
                    account_type: 'buyer',
                    account_code: 'ACC-004',
                    opening_balance: 0,
                    opening_type: 'CR',
                    level: 1,
                    status: 'active',
                    description: 'Regular fabric buyers',
                    contact_details: 'Buyers Group\nPhone: 9876543211'
                },
                // Dying Parties
                {
                    type: 'account',
                    account_name: 'Dying Party - ABC Dyers',
                    account_type: 'dying_party',
                    account_code: 'ACC-005',
                    opening_balance: 0,
                    opening_type: 'CR',
                    level: 1,
                    status: 'active',
                    description: 'External dying service provider',
                    contact_details: 'ABC Dyers\nAddress: Industrial Area\nPhone: 9876543212'
                },
                // Packing Parties
                {
                    type: 'account',
                    account_name: 'Packing Party - XYZ Packers',
                    account_type: 'packing_party',
                    account_code: 'ACC-006',
                    opening_balance: 0,
                    opening_type: 'CR',
                    level: 1,
                    status: 'active',
                    description: 'External packing service provider',
                    contact_details: 'XYZ Packers\nAddress: Packing Zone\nPhone: 9876543213'
                },
                // Expenses
                {
                    type: 'account',
                    account_name: 'Factory Expenses',
                    account_type: 'expense',
                    account_code: 'ACC-007',
                    opening_balance: 0,
                    opening_type: 'DR',
                    level: 1,
                    status: 'active',
                    description: 'General factory expenses'
                }
            ];
            
            for (const account of accounts) {
                await schema.createDoc('account', account);
            }
            
            // Create sample lots
            const lots = [
                {
                    type: 'lot',
                    lot_number: 'LOT-001',
                    lot_type: 'production',
                    initial_product_id: (await schema.findDocs('product'))[0]._id, // Cotton Gray Cloth
                    current_product_id: (await schema.findDocs('product'))[0]._id,
                    initial_qty: 1000,
                    current_qty: 1000,
                    current_stage: 'gray',
                    uom: 'meter',
                    cost_per_unit: 50,
                    total_cost: 50000,
                    status: 'active',
                    created_by: 'system',
                    remarks: 'Initial stock'
                },
                {
                    type: 'lot',
                    lot_number: 'LOT-002',
                    lot_type: 'production',
                    initial_product_id: (await schema.findDocs('product'))[1]._id, // Polyester Gray Cloth
                    current_product_id: (await schema.findDocs('product'))[1]._id,
                    initial_qty: 800,
                    current_qty: 800,
                    current_stage: 'gray',
                    uom: 'meter',
                    cost_per_unit: 40,
                    total_cost: 32000,
                    status: 'active',
                    created_by: 'system',
                    remarks: 'Initial stock'
                }
            ];
            
            for (const lot of lots) {
                await schema.createDoc('lot', lot);
            }
            
            // Create sample employees
            const employees = [
                {
                    type: 'employee',
                    employee_code: 'EMP-001',
                    employee_name: 'John Doe',
                    department: 'Production',
                    designation: 'Supervisor',
                    salary_type: 'monthly',
                    basic_salary: 25000,
                    contact_number: '9876543214',
                    address: 'Worker Colony, City',
                    status: 'active',
                    joined_date: new Date().toISOString()
                },
                {
                    type: 'employee',
                    employee_code: 'EMP-002',
                    employee_name: 'Jane Smith',
                    department: 'Accounts',
                    designation: 'Accountant',
                    salary_type: 'monthly',
                    basic_salary: 30000,
                    contact_number: '9876543215',
                    address: 'Accounts Block, City',
                    status: 'active',
                    joined_date: new Date().toISOString()
                }
            ];
            
            for (const employee of employees) {
                await schema.createDoc('employee', employee);
            }
            
            // Create default settings
            const settings = {
                type: 'setting',
                setting_type: 'general',
                company_name: 'Textile ERP System',
                default_currency: 'INR',
                lot_prefix: 'LOT',
                purchase_prefix: 'PUR',
                invoice_prefix: 'INV',
                default_dying_cost: 15.00,
                default_packing_cost: 10.00,
                low_stock_threshold: 100,
                enable_auto_sync: true,
                enable_email_alerts: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: 'system'
            };
            
            await schema.createDoc('setting', settings);
            
            console.log('Database initialized with sample data');
         //   alert('Database initialized successfully!\n\nLogin Credentials:\nAdmin: admin/admin123\nManager: manager/manager123\nUser: user/user123');
        }
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Run initialization when database is ready
setTimeout(initializeDatabase, 1000);