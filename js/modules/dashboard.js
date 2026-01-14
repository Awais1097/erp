// Dashboard Module
const dashboardModule = {
    async load() {
        const content = `
            <div class="row mb-4">
                <div class="col-md-12">
                    <h4><i class="bi bi-speedometer2"></i> Dashboard</h4>
                    <p class="text-muted">Welcome back, ${authManager.getCurrentUser()?.name || 'User'}! Here's your overview.</p>
                </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="row">
                <div class="col-md-3 mb-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">Total Lots</h5>
                                    <h2 class="card-text" id="total-lots">0</h2>
                                </div>
                                <i class="bi bi-box-seam display-6 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 mb-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">Active Lots</h5>
                                    <h2 class="card-text" id="active-lots">0</h2>
                                </div>
                                <i class="bi bi-check-circle display-6 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 mb-4">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">This Month Sales</h5>
                                    <h2 class="card-text" id="month-sales">Rs0</h2>
                                </div>
                                <i class="bi bi-cash-coin display-6 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-3 mb-4">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 class="card-title">Pending Rejects</h5>
                                    <h2 class="card-text" id="pending-rejects">0</h2>
                                </div>
                                <i class="bi bi-x-circle display-6 opacity-50"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Charts and Tables -->
            <div class="row">
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-activity"></i> Recent Stock Movements</h5>
                        </div>
                        <div class="card-body">
                            <div id="recent-movements">Loading...</div>
                        </div>
                    </div>
                    
                    <div class="card mt-4">
                        <div class="card-header">
                            <h5><i class="bi bi-clock-history"></i> Quick Actions</h5>
                        </div>
                        <div class="card-body">
                            <div class="row g-2">
                                ${authManager.hasPermission('purchase') ? `
                                <div class="col-md-6">
                                    <button class="btn btn-outline-primary w-100" onclick="app.showModule('purchase')">
                                        <i class="bi bi-cart-plus"></i> New Purchase
                                    </button>
                                </div>
                                ` : ''}
                                
                                ${authManager.hasPermission('sales') ? `
                                <div class="col-md-6">
                                    <button class="btn btn-outline-success w-100" onclick="app.showModule('sales')">
                                        <i class="bi bi-cash-coin"></i> New Sale
                                    </button>
                                </div>
                                ` : ''}
                                
                                ${authManager.hasPermission('dying') ? `
                                <div class="col-md-6">
                                    <button class="btn btn-outline-warning w-100" onclick="app.showModule('dying')">
                                        <i class="bi bi-palette"></i> New Dying
                                    </button>
                                </div>
                                ` : ''}
                                
                                ${authManager.hasPermission('packing') ? `
                                <div class="col-md-6">
                                    <button class="btn btn-outline-info w-100" onclick="app.showModule('packing')">
                                        <i class="bi bi-box"></i> New Packing
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-pie-chart"></i> Lots by Stage</h5>
                        </div>
                        <div class="card-body">
                            <div id="lots-by-stage">Loading...</div>
                            <canvas id="stageChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                    
                    <div class="card mt-4">
                        <div class="card-header">
                            <h5><i class="bi bi-exclamation-triangle"></i> Alerts</h5>
                        </div>
                        <div class="card-body">
                            <div id="alerts-list">Loading alerts...</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Activity -->
            <div class="row mt-4">
                <div class="col-md-12">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-list-task"></i> Recent Activity</h5>
                        </div>
                        <div class="card-body">
                            <div id="recent-activity">Loading activities...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('content-area').innerHTML = content;
        await this.updateDashboardStats();
    },

    async updateDashboardStats() {
        try {
            // Get total lots
            const lots = await schema.findDocs('lot');
            document.getElementById('total-lots').textContent = lots.length;
            
            // Get active lots
            const activeLots = lots.filter(lot => lot.status === 'active');
            document.getElementById('active-lots').textContent = activeLots.length;
            
            // Get this month sales
            const today = new Date();
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const sales = await schema.findDocs('sale');
            const monthSales = sales.filter(sale => sale.sale_date >= monthStart)
                .reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
            document.getElementById('month-sales').textContent = `Rs${monthSales.toLocaleString()}`;
            
            // Get pending rejects
            const rejects = await schema.findDocs('gray_reject');
            const pendingRejects = rejects.filter(reject => reject.status === 'pending');
            document.getElementById('pending-rejects').textContent = pendingRejects.length;
            
            // Update recent movements
            await this.updateRecentMovements();
            
            // Update lots by stage
            await this.updateStageChart();
            
            // Update alerts
            await this.updateAlerts();
            
            // Update recent activity
            await this.updateRecentActivity();
            
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    },

    async updateRecentMovements() {
        try {
            const movements = await schema.findDocs('stock_movement');
            const recentMovements = movements
                .sort((a, b) => new Date(b.movement_date) - new Date(a.movement_date))
                .slice(0, 5);
            
            const movementsHtml = recentMovements.map(movement => `
                <div class="d-flex justify-content-between align-items-center border-bottom py-2">
                    <div>
                        <small class="text-muted">${new Date(movement.movement_date).toLocaleDateString()}</small>
                        <div class="fw-medium">${movement.reference_type || 'Movement'}: ${movement.qty} ${movement.uom}</div>
                        <small>${movement.remarks || ''}</small>
                    </div>
                    <span class="lot-tag ${movement.to_stage}-stage">${movement.to_stage}</span>
                </div>
            `).join('');
            
            document.getElementById('recent-movements').innerHTML = 
                movementsHtml || '<div class="text-muted text-center">No recent movements</div>';
        } catch (error) {
            console.error('Error updating recent movements:', error);
        }
    },

    async updateStageChart() {
        try {
            const lots = await schema.findDocs('lot');
            const activeLots = lots.filter(lot => lot.status === 'active');
            
            // Count by stage
            const stageCounts = {};
            activeLots.forEach(lot => {
                stageCounts[lot.current_stage] = (stageCounts[lot.current_stage] || 0) + 1;
            });
            
            const stageHtml = Object.entries(stageCounts).map(([stage, count]) => `
                <div class="mb-2">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="lot-tag ${stage}-stage me-2">${stage}</span>
                            <span>${count} lots</span>
                        </div>
                        <span class="badge bg-primary">${((count / activeLots.length) * 100).toFixed(1)}%</span>
                    </div>
                    <div class="progress" style="height: 8px;">
                        <div class="progress-bar" style="width: ${(count / activeLots.length) * 100}%"></div>
                    </div>
                </div>
            `).join('');
            
            document.getElementById('lots-by-stage').innerHTML = 
                stageHtml || '<div class="text-muted text-center">No active lots</div>';
            
            // Create chart if Chart.js is available
            if (typeof Chart !== 'undefined') {
                const ctx = document.getElementById('stageChart').getContext('2d');
                new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: Object.keys(stageCounts),
                        datasets: [{
                            data: Object.values(stageCounts),
                            backgroundColor: [
                                '#95a5a6', // gray
                                '#e74c3c', // dying
                                '#3498db', // packing
                                '#2ecc71', // sale
                                '#f39c12', // other
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error updating stage chart:', error);
        }
    },

    async updateAlerts() {
        try {
            const alerts = [];
            
            // Check for low stock
            const lots = await schema.findDocs('lot');
            const lowStockLots = lots.filter(lot => 
                lot.current_qty < 100 && lot.status === 'active'
            );
            
            if (lowStockLots.length > 0) {
                alerts.push({
                    type: 'warning',
                    message: `${lowStockLots.length} lots have low stock (< 100 units)`,
                    action: 'inventory'
                });
            }
            
            // Check for pending purchases
            const purchases = await schema.findDocs('purchase');
            const pendingPurchases = purchases.filter(p => p.status === 'pending');
            
            if (pendingPurchases.length > 0) {
                alerts.push({
                    type: 'info',
                    message: `${pendingPurchases.length} pending purchases need attention`,
                    action: 'purchase'
                });
            }
            
            // Check for pending rejections
            const rejects = await schema.findDocs('gray_reject');
            const pendingRejects = rejects.filter(r => r.status === 'pending');
            
            if (pendingRejects.length > 0) {
                alerts.push({
                    type: 'danger',
                    message: `${pendingRejects.length} rejections pending approval`,
                    action: 'purchase'
                });
            }
            
            const alertsHtml = alerts.map(alert => `
                <div class="alert alert-${alert.type} alert-dismissible fade show">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    ${alert.message}
                    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    <a href="#" onclick="app.showModule('${alert.action}')" class="alert-link float-end">
                        View Details
                    </a>
                </div>
            `).join('');
            
            document.getElementById('alerts-list').innerHTML = 
                alertsHtml || '<div class="text-muted text-center">No alerts</div>';
                
        } catch (error) {
            console.error('Error updating alerts:', error);
        }
    },

    async updateRecentActivity() {
        try {
            // Get recent activities from various modules
            const activities = [];
            
            // Recent sales
            const sales = await schema.findDocs('sale');
            const recentSales = sales.slice(-3).reverse();
            recentSales.forEach(sale => {
                activities.push({
                    type: 'sale',
                    date: sale.sale_date,
                    description: `Sale created: ${sale.invoice_number}`,
                    amount: sale.total_amount
                });
            });
            
            // Recent purchases
            const purchases = await schema.findDocs('purchase');
            const recentPurchases = purchases.slice(-2).reverse();
            recentPurchases.forEach(purchase => {
                activities.push({
                    type: 'purchase',
                    date: purchase.purchase_date,
                    description: `Purchase created: ${purchase.purchase_number}`,
                    amount: purchase.total_amount
                });
            });
            
            // Recent stock movements
            const movements = await schema.findDocs('stock_movement');
            const recentMovements = movements.slice(-3).reverse();
            recentMovements.forEach(movement => {
                activities.push({
                    type: 'movement',
                    date: movement.movement_date,
                    description: `Stock moved: ${movement.qty} ${movement.uom} to ${movement.to_stage}`,
                    amount: null
                });
            });
            
            // Sort by date and limit
            activities.sort((a, b) => new Date(b.date) - new Date(a.date));
            const recentActivities = activities.slice(0, 8);
            
            const activitiesHtml = recentActivities.map(activity => `
                <div class="d-flex border-bottom py-2">
                    <div class="flex-shrink-0">
                        <i class="bi bi-${this.getActivityIcon(activity.type)} text-${this.getActivityColor(activity.type)}"></i>
                    </div>
                    <div class="flex-grow-1 ms-3">
                        <div class="fw-medium">${activity.description}</div>
                        <small class="text-muted">${new Date(activity.date).toLocaleString()}</small>
                        ${activity.amount ? `<div class="text-end text-success">Rs${activity.amount.toFixed(2)}</div>` : ''}
                    </div>
                </div>
            `).join('');
            
            document.getElementById('recent-activity').innerHTML = 
                activitiesHtml || '<div class="text-muted text-center">No recent activity</div>';
                
        } catch (error) {
            console.error('Error updating recent activity:', error);
        }
    },

    getActivityIcon(type) {
        const icons = {
            'sale': 'cash-coin',
            'purchase': 'cart-plus',
            'movement': 'arrow-right-circle',
            'reject': 'x-circle',
            'process': 'arrow-repeat'
        };
        return icons[type] || 'activity';
    },

    getActivityColor(type) {
        const colors = {
            'sale': 'success',
            'purchase': 'primary',
            'movement': 'info',
            'reject': 'danger',
            'process': 'warning'
        };
        return colors[type] || 'secondary';
    },

    async refreshDashboard() {
        await this.updateDashboardStats();
        app.showToast('Dashboard refreshed', 'info');
    }
};

// Export the module
window.dashboardModule = dashboardModule;