// Packing Module
const packingModule = {
    async load() {
        if (!authManager.hasPermission('packing')) {
            document.getElementById('content-area').innerHTML = `
                <div class="alert alert-danger">
                    <h4><i class="bi bi-shield-exclamation"></i> Access Denied</h4>
                    <p>You don't have permission to access the Packing module.</p>
                </div>
            `;
            return;
        }
        
        const content = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h4><i class="bi bi-box"></i> Packing Process</h4>
                    <p class="text-muted">Manage cloth packing and final article preparation</p>
                </div>
                <div>
                    <button class="btn btn-primary" onclick="packingModule.showPackingForm()">
                        <i class="bi bi-plus-circle"></i> New Packing
                    </button>
                </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Active Packing</h6>
                            <h3 id="active-packing">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">This Month</h6>
                            <h3 id="month-packing">0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Total Cost</h6>
                            <h3 id="total-cost">Rs0</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card text-center">
                        <div class="card-body">
                            <h6 class="text-muted">Avg Cost/Mtr</h6>
                            <h3 id="avg-cost">Rs0</h3>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row g-3">
                        <div class="col-md-3">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="filterStatus" onchange="packingModule.filterPacking()">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Packing Party</label>
                            <select class="form-select" id="filterParty" onchange="packingModule.filterPacking()">
                                <option value="">All Parties</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date From</label>
                            <input type="date" class="form-control" id="filterDateFrom" onchange="packingModule.filterPacking()">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label">Date To</label>
                            <input type="date" class="form-control" id="filterDateTo" onchange="packingModule.filterPacking()">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Main Table -->
            <div class="card">
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Process #</th>
                                    <th>Lot</th>
                                    <th>Packing Party</th>
                                    <th>Qty In</th>
                                    <th>Qty Out</th>
                                    <th>Cost/Mtr</th>
                                    <th>Total Cost</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="packing-table-body">
                                Loading...
                            </tbody>
                        </table>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                            <span id="packing-count">0</span> processes found
                        </div>
                        <nav>
                            <ul class="pagination" id="pagination">
                                <!-- Pagination will be generated here -->
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.initializeFilters();
        await this.loadPackingTable();
        await this.updateStats();
    },

    async initializeFilters() {
        try {
            const packingParties = (await schema.findDocs('account')).filter(acc => 
                acc.account_type === 'packing_party' || acc.account_name.includes('Packing')
            );
            const partySelect = document.getElementById('filterParty');
            
            packingParties.forEach(party => {
                const option = document.createElement('option');
                option.value = party._id;
                option.textContent = party.account_name;
                partySelect.appendChild(option);
            });
            
            // Set default dates
            const today = new Date();
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            
            document.getElementById('filterDateFrom').value = firstDay.toISOString().split('T')[0];
            document.getElementById('filterDateTo').value = today.toISOString().split('T')[0];
            
        } catch (error) {
            console.error('Error initializing filters:', error);
        }
    },

    async loadPackingTable(page = 1, itemsPerPage = 10) {
        try {
            const packingProcesses = await schema.findDocs('process_order');
            const filteredProcesses = packingProcesses.filter(p => p.process_type === 'packing');
            
            const accounts = await schema.findDocs('account');
            const lots = await schema.findDocs('lot');
            
            const accountMap = {};
            accounts.forEach(a => accountMap[a._id] = a);
            
            const lotMap = {};
            lots.forEach(l => lotMap[l._id] = l);
            
            // Apply filters
            let filtered = this.applyFilters(filteredProcesses);
            
            // Calculate pagination
            const total = filtered.length;
            const totalPages = Math.ceil(total / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginated = filtered.slice(startIndex, endIndex);
            
            // Generate table rows
            const html = paginated.map(process => {
                const party = accountMap[process.party_account_id];
                const lot = lotMap[process.lot_id];
                
                return `
                    <tr>
                        <td>
                            <div class="fw-bold">PAC-${process.process_number || process._id.substr(-6)}</div>
                            <small class="text-muted">${new Date(process.process_date).toLocaleDateString()}</small>
                        </td>
                        <td>
                            <div>${lot?.lot_number || 'N/A'}</div>
                            <small class="text-muted">${lot?.current_qty || 0} ${lot?.uom || ''}</small>
                        </td>
                        <td>${party?.account_name || 'N/A'}</td>
                        <td>${process.issued_qty} ${process.uom}</td>
                        <td>${process.received_qty || '-'} ${process.uom}</td>
                        <td>Rs${process.process_cost_per_mtr?.toFixed(2) || '0.00'}</td>
                        <td>Rs${process.total_cost?.toFixed(2) || '0.00'}</td>
                        <td>
                            <span class="badge ${this.getStatusBadge(process.status)}">
                                ${process.status}
                            </span>
                        </td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <button class="btn btn-outline-primary" onclick="packingModule.viewProcess('${process._id}')">
                                    <i class="bi bi-eye"></i>
                                </button>
                                ${process.status !== 'completed' ? `
                                <button class="btn btn-outline-success" onclick="packingModule.completeProcess('${process._id}')">
                                    <i class="bi bi-check-circle"></i>
                                </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
            
            document.getElementById('packing-table-body').innerHTML = 
                html || '<tr><td colspan="9" class="text-center">No packing processes found</td></tr>';
            
            document.getElementById('packing-count').textContent = total;
            this.generatePagination(page, totalPages);
            
        } catch (error) {
            console.error('Error loading packing processes:', error);
        }
    },

    applyFilters(processes) {
        const status = document.getElementById('filterStatus').value;
        const party = document.getElementById('filterParty').value;
        const dateFrom = document.getElementById('filterDateFrom').value;
        const dateTo = document.getElementById('filterDateTo').value;
        
        return processes.filter(process => {
            if (status && process.status !== status) return false;
            if (party && process.party_account_id !== party) return false;
            
            if (dateFrom) {
                const processDate = new Date(process.process_date);
                const fromDate = new Date(dateFrom);
                if (processDate < fromDate) return false;
            }
            
            if (dateTo) {
                const processDate = new Date(process.process_date);
                const toDate = new Date(dateTo);
                toDate.setHours(23, 59, 59, 999);
                if (processDate > toDate) return false;
            }
            
            return true;
        }).sort((a, b) => new Date(b.process_date) - new Date(a.process_date));
    },

    getStatusBadge(status) {
        const badges = {
            'pending': 'bg-warning',
            'in_progress': 'bg-info',
            'completed': 'bg-success',
            'cancelled': 'bg-secondary'
        };
        return badges[status] || 'bg-light text-dark';
    },

    generatePagination(currentPage, totalPages) {
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';
        
        if (totalPages <= 1) return;
        
        // Previous button
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevLi.innerHTML = `<a class="page-link" href="#" onclick="packingModule.loadPackingTable(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>`;
        pagination.appendChild(prevLi);
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                const li = document.createElement('li');
                li.className = `page-item ${i === currentPage ? 'active' : ''}`;
                li.innerHTML = `<a class="page-link" href="#" onclick="packingModule.loadPackingTable(${i})">${i}</a>`;
                pagination.appendChild(li);
            }
        }
        
        // Next button
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextLi.innerHTML = `<a class="page-link" href="#" onclick="packingModule.loadPackingTable(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>`;
        pagination.appendChild(nextLi);
    },

    async updateStats() {
        try {
            const packingProcesses = await schema.findDocs('process_order');
            const filtered = packingProcesses.filter(p => p.process_type === 'packing');
            
            const active = filtered.filter(p => p.status === 'in_progress').length;
            const thisMonth = filtered.filter(p => {
                const processDate = new Date(p.process_date);
                const today = new Date();
                return processDate.getMonth() === today.getMonth() && 
                       processDate.getFullYear() === today.getFullYear();
            }).length;
            
            const totalCost = filtered.reduce((sum, p) => sum + (p.total_cost || 0), 0);
            const totalQty = filtered.reduce((sum, p) => sum + (p.issued_qty || 0), 0);
            const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
            
            document.getElementById('active-packing').textContent = active;
            document.getElementById('month-packing').textContent = thisMonth;
            document.getElementById('total-cost').textContent = `Rs${totalCost.toFixed(2)}`;
            document.getElementById('avg-cost').textContent = `Rs${avgCost.toFixed(2)}`;
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    },

    filterPacking() {
        this.loadPackingTable(1);
    },

    async showPackingForm() {
        try {
            // Get available lots in dying stage
            const lots = (await schema.findDocs('lot')).filter(lot => 
                lot.current_stage === 'dying' && lot.status === 'active'
            );
            
            // Get packing parties
            const packingParties = (await schema.findDocs('account')).filter(acc => 
                acc.account_type === 'packing_party' || acc.account_name.includes('Packing')
            );
            
            // Get available products for packing stage
            const products = (await schema.findDocs('product')).filter(p => 
                p.category === 'finished'
            );
            
            const lotOptions = lots.map(lot => 
                `<option value="${lot._id}">${lot.lot_number} (${lot.current_qty} ${lot.uom})</option>`
            ).join('');
            
            const partyOptions = packingParties.map(party => 
                `<option value="${party._id}">${party.account_name}</option>`
            ).join('');
            
            const productOptions = products.map(product => 
                `<option value="${product._id}">${product.product_name}</option>`
            ).join('');
            
            const formHtml = `
                <form id="packingForm" onsubmit="return packingModule.savePacking(event)">
                    <div class="form-section">
                        <h6 class="section-title">Select Lot</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Lot *</label>
                                <select class="form-select" id="lotId" required onchange="packingModule.loadLotDetails(this.value)">
                                    <option value="">Select Lot</option>
                                    ${lotOptions}
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Available Quantity</label>
                                <input type="text" class="form-control" id="availableQty" readonly>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h6 class="section-title">Process Details</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Packing Party *</label>
                                <select class="form-select" id="partyAccountId" required>
                                    <option value="">Select Party</option>
                                    ${partyOptions}
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Process Date *</label>
                                <input type="date" class="form-control" id="processDate" 
                                       value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Quantity to Pack *</label>
                                <input type="number" class="form-control" id="issuedQty" 
                                       step="0.01" min="0" required>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">UOM *</label>
                                <select class="form-select" id="uom" required>
                                    <option value="meter">Meter</option>
                                    <option value="thaan">Thaan</option>
                                    <option value="bag">Bag</option>
                                    <option value="piece">Piece</option>
                                </select>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="form-label">Output Product *</label>
                                <select class="form-select" id="outputProductId" required>
                                    <option value="">Select Product</option>
                                    ${productOptions}
                                </select>
                            </div>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Article Name</label>
                                <input type="text" class="form-control" id="articleName" 
                                       placeholder="Enter article name after packing">
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Color/Design</label>
                                <input type="text" class="form-control" id="colorDesign" 
                                       placeholder="Enter color/design details">
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h6 class="section-title">Cost Calculation</h6>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Cost per Meter (Rs) *</label>
                                <input type="number" class="form-control" id="costPerMtr" 
                                       step="0.01" min="0" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">Total Cost (Rs)</label>
                                <input type="number" class="form-control" id="totalCost" readonly>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mb-3">
                        <label class="form-label">Remarks</label>
                        <textarea class="form-control" id="remarks" rows="2"></textarea>
                    </div>
                    
                    <div class="d-grid">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-save"></i> Start Packing Process
                        </button>
                    </div>
                </form>
                
                <script>
                    // Auto-calculate total cost
                    document.getElementById('issuedQty').addEventListener('input', function() {
                        const qty = parseFloat(this.value) || 0;
                        const cost = parseFloat(document.getElementById('costPerMtr').value) || 0;
                        document.getElementById('totalCost').value = (qty * cost).toFixed(2);
                    });
                    
                    document.getElementById('costPerMtr').addEventListener('input', function() {
                        const qty = parseFloat(document.getElementById('issuedQty').value) || 0;
                        const cost = parseFloat(this.value) || 0;
                        document.getElementById('totalCost').value = (qty * cost).toFixed(2);
                    });
                </script>
            `;
            
            app.showModal('New Packing Process', formHtml);
            
        } catch (error) {
            console.error('Error showing packing form:', error);
            app.showToast('Error loading form: ' + error.message, 'danger');
        }
    },

    async loadLotDetails(lotId) {
        try {
            const lot = await schema.getDoc(lotId);
            if (lot) {
                document.getElementById('availableQty').value = 
                    `${lot.current_qty} ${lot.uom}`;
                document.getElementById('issuedQty').max = lot.current_qty;
            }
        } catch (error) {
            console.error('Error loading lot details:', error);
        }
    },

    async savePacking(event) {
        event.preventDefault();
        
        try {
            const lotId = document.getElementById('lotId').value;
            const issuedQty = parseFloat(document.getElementById('issuedQty').value);
            
            // Check if quantity is valid
            const lot = await schema.getDoc(lotId);
            if (issuedQty > lot.current_qty) {
                app.showToast('Cannot issue more than available quantity', 'danger');
                return;
            }
            
            // Create packing process
            const processData = {
                process_type: 'packing',
                process_number: 'PAC-' + Date.now().toString().slice(-6),
                lot_id: lotId,
                party_account_id: document.getElementById('partyAccountId').value,
                process_date: document.getElementById('processDate').value,
                issued_qty: issuedQty,
                uom: document.getElementById('uom').value,
                output_product_id: document.getElementById('outputProductId').value,
                article_name: document.getElementById('articleName').value,
                color_design: document.getElementById('colorDesign').value,
                process_cost_per_mtr: parseFloat(document.getElementById('costPerMtr').value),
                total_cost: parseFloat(document.getElementById('totalCost').value),
                status: 'in_progress',
                remarks: document.getElementById('remarks').value,
                created_by: authManager.getCurrentUser().username
            };
            
            const process = await schema.createDoc('process_order', processData);
            
            // Create cost record
            await schema.createDoc('lot_cost', {
                lot_id: lotId,
                cost_type: 'packing',
                cost_per_mtr: processData.process_cost_per_mtr,
                total_cost: processData.total_cost,
                process_id: process._id,
                created_by: authManager.getCurrentUser().username
            });
            
            // Create stock movement
            await schema.createDoc('stock_movement', {
                lot_id: lotId,
                from_stage: 'dying',
                to_stage: 'packing',
                product_before: lot.current_product_id,
                product_after: processData.output_product_id,
                qty: issuedQty,
                uom: processData.uom,
                reference_type: 'packing_issue',
                reference_id: process._id,
                movement_date: new Date().toISOString(),
                remarks: 'Issued for packing process',
                created_by: authManager.getCurrentUser().username
            });
            
            // Update lot stage
            lot.current_stage = 'packing';
            await schema.updateDoc(lot);
            
            app.showToast('Packing process started successfully!', 'success');
            app.hideModal();
            await this.loadPackingTable();
            await this.updateStats();
            
        } catch (error) {
            console.error('Error saving packing process:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    },

    async viewProcess(processId) {
        try {
            const process = await schema.getDoc(processId);
            const lot = await schema.getDoc(process.lot_id);
            const party = await schema.getDoc(process.party_account_id);
            const outputProduct = await schema.getDoc(process.output_product_id);
            
            const content = `
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Process Number</th><td>${process.process_number}</td></tr>
                            <tr><th>Lot Number</th><td>${lot?.lot_number || 'N/A'}</td></tr>
                            <tr><th>Packing Party</th><td>${party?.account_name || 'N/A'}</td></tr>
                            <tr><th>Article Name</th><td>${process.article_name || '-'}</td></tr>
                            <tr><th>Color/Design</th><td>${process.color_design || '-'}</td></tr>
                            <tr><th>Process Date</th><td>${new Date(process.process_date).toLocaleDateString()}</td></tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-bordered">
                            <tr><th>Quantity</th><td>${process.issued_qty} ${process.uom}</td></tr>
                            <tr><th>Output Product</th><td>${outputProduct?.product_name || 'N/A'}</td></tr>
                            <tr><th>Cost per Meter</th><td>Rs${process.process_cost_per_mtr?.toFixed(2) || '0.00'}</td></tr>
                            <tr><th>Total Cost</th><td>Rs${process.total_cost?.toFixed(2) || '0.00'}</td></tr>
                            <tr><th>Status</th><td><span class="badge ${this.getStatusBadge(process.status)}">${process.status}</span></td></tr>
                            <tr><th>Created By</th><td>${process.created_by || 'System'}</td></tr>
                        </table>
                    </div>
                </div>
                
                <div class="mt-4">
                    <h6>Remarks</h6>
                    <div class="alert alert-info">
                        ${process.remarks || 'No remarks'}
                    </div>
                </div>
                
                ${process.status === 'in_progress' ? `
                <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-success" onclick="packingModule.completeProcess('${processId}')">
                        <i class="bi bi-check-circle"></i> Complete Process
                    </button>
                </div>
                ` : ''}
            `;
            
            app.showModal('Packing Process Details', content);
            
        } catch (error) {
            console.error('Error viewing process:', error);
            app.showToast('Error loading details', 'danger');
        }
    },

    async completeProcess(processId) {
        try {
            const process = await schema.getDoc(processId);
            const lot = await schema.getDoc(process.lot_id);
            
            const receivedQty = prompt('Enter received quantity after packing:');
            if (!receivedQty || parseFloat(receivedQty) <= 0) {
                app.showToast('Invalid quantity', 'danger');
                return;
            }
            
            process.status = 'completed';
            process.received_qty = parseFloat(receivedQty);
            await schema.updateDoc(process);
            
            // Update lot with new product and stage
            lot.current_product_id = process.output_product_id;
            lot.current_stage = 'sale';
            lot.current_qty = process.received_qty;
            await schema.updateDoc(lot);
            
            // Create stock movement for completion
            await schema.createDoc('stock_movement', {
                lot_id: process.lot_id,
                from_stage: 'packing',
                to_stage: 'sale',
                product_before: lot.current_product_id,
                product_after: process.output_product_id,
                qty: process.received_qty,
                uom: process.uom,
                reference_type: 'packing_complete',
                reference_id: process._id,
                movement_date: new Date().toISOString(),
                remarks: 'Packing process completed, ready for sale',
                created_by: authManager.getCurrentUser().username
            });
            
            app.showToast('Packing process completed successfully!', 'success');
            await this.loadPackingTable();
            
        } catch (error) {
            console.error('Error completing process:', error);
            app.showToast('Error: ' + error.message, 'danger');
        }
    }
};

// Export the module
window.packingModule = packingModule;