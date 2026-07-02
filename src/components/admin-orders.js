import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

const STATUS_COLORS = {
    'pending': '#EAB308',
    'processing': '#3B82F6',
    'shipped': '#F37021',
    'delivered': '#16A34A',
    'cancelled': '#DC2626'
};

export const AdminOrdersManager = {
    currentPage: 1,
    currentStatus: '',
    searchQuery: '',
    totalOrders: 0,
    orders: [],

    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminOrdersPanel');
        if (existing) existing.remove();

        // Hide dashboard controls, stats, charts
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminOrdersPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminOrdersPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminOrdersPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2 data-translate="manageOrders">Manage Orders</h2>
                    <p data-translate="manageOrdersDesc">View and update all customer orders</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-primary btn-sm" onclick="AdminOrdersManager.exportCSV()">
                        ↓ ${getT('exportCSV') || 'Export CSV'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="AdminOrdersManager.goBack()">
                        ← ${getT('backToDashboard') || 'Back to Dashboard'}
                    </button>
                </div>
            </div>
            <div class="admin-orders-filters">
                <select id="adminOrderStatusFilter" onchange="AdminOrdersManager.filterChanged()">
                    <option value="" data-translate="allStatuses">All Statuses</option>
                    <option value="pending" data-translate="pending">Pending</option>
                    <option value="processing" data-translate="processing">Processing</option>
                    <option value="shipped" data-translate="shipped">Shipped</option>
                    <option value="delivered" data-translate="delivered">Delivered</option>
                    <option value="cancelled" data-translate="cancelled">Cancelled</option>
                </select>
                <input type="text" id="adminOrderSearch" placeholder="${getT('searchOrders') || 'Search orders...'}"
                    onkeydown="if(event.key==='Enter') AdminOrdersManager.searchChanged()">
                <button class="btn btn-primary btn-sm" onclick="AdminOrdersManager.searchChanged()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    ${getT('search') || 'Search'}
                </button>
            </div>
            <div class="admin-orders-table-wrap">
                <table class="admin-orders-table">
                    <thead>
                        <tr>
                            <th data-translate="orderId">Order ID</th>
                            <th data-translate="customer">Customer</th>
                            <th data-translate="items">Items</th>
                            <th data-translate="total">Total</th>
                            <th data-translate="status">Status</th>
                            <th data-translate="payment">Payment</th>
                            <th data-translate="tracking">Tracking</th>
                            <th data-translate="date">Date</th>
                            <th data-translate="actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="adminOrdersBody">
                        <tr><td colspan="9" class="loading-cell">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="adminOrdersPagination" class="admin-orders-pagination"></div>
        `;

        await this.fetchOrders();
    },

    async fetchOrders() {
        const tbody = document.getElementById('adminOrdersBody');
        if (!tbody) return;

        const params = new URLSearchParams({ page: this.currentPage });
        if (this.currentStatus) params.set('status', this.currentStatus);
        if (this.searchQuery) params.set('search', this.searchQuery);

        try {
            const resp = await fetch(`${API_URL}/admin/orders/?${params}`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();
            this.orders = data.orders;
            this.totalOrders = data.total;
            this.renderTable();
            this.renderPagination();
        } catch (err) {
            logger.error('Failed to fetch orders:', err);
            tbody.innerHTML = `<tr><td colspan="8" class="error-cell">Failed to load orders. Check your connection.</td></tr>`;
        }
    },

    renderTable() {
        const tbody = document.getElementById('adminOrdersBody');
        if (!tbody) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        if (this.orders.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty-cell">${getT('noOrdersFound') || 'No orders found.'}</td></tr>`;
            return;
        }

        tbody.innerHTML = this.orders.map(order => {
            const statusColor = STATUS_COLORS[order.status] || '#626567';
            const hasTracking = order.tracking_number;
            return `
                <tr>
                    <td class="order-id-cell">#${order.id.slice(-8).toUpperCase()}</td>
                    <td>${order.user}<br><small>${order.email}</small></td>
                    <td>${order.items_count}</td>
                    <td><strong>$${Number(order.total).toFixed(2)}</strong></td>
                    <td>
                        <span class="status-badge-small" style="background-color: ${statusColor}15; color: ${statusColor};">
                            ${order.status}
                        </span>
                    </td>
                    <td>
                        <small>${order.payment_method}</small><br>
                        <small class="payment-${order.payment_status}">${order.payment_status}</small>
                    </td>
                    <td>
                        <div class="tracking-cell" id="tracking-${order.id}" style="cursor:pointer;"
                             onclick="AdminOrdersManager.editTracking('${order.id}')">
                            ${hasTracking ? `<small>${order.tracking_number}</small>` : `<small style="color:#999;">${getT('addTracking') || 'Add tracking'}</small>`}
                            ${order.carrier ? `<br><small style="color:#666;">${order.carrier}</small>` : ''}
                        </div>
                    </td>
                    <td><small>${new Date(order.created_at).toLocaleDateString()}</small></td>
                    <td>
                        <select class="status-select" data-order-id="${order.id}"
                            onchange="AdminOrdersManager.updateStatus('${order.id}', this.value)">
                            <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                            <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                            <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                            <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                            <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                        </select>
                        ${order.payment_status === 'paid' ? `
                            <button class="btn btn-sm" style="margin-top:4px;background:#FEE2E2;color:#DC2626;border:1px solid #FECACA;width:100%;"
                                onclick="AdminOrdersManager.refundOrder('${order.id}')">
                                ${getT('refund') || 'Refund'}
                            </button>
                        ` : order.payment_status === 'refunded' ? `
                            <small style="color:#DC2626;display:block;margin-top:4px;text-align:center;">${getT('refunded') || 'Refunded'}</small>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    },

    renderPagination() {
        const container = document.getElementById('adminOrdersPagination');
        if (!container) return;
        const totalPages = Math.ceil(this.totalOrders / 20);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        let html = `<button ${this.currentPage <= 1 ? 'disabled' : ''} onclick="AdminOrdersManager.goToPage(${this.currentPage - 1})">← Prev</button>`;
        html += `<span>Page ${this.currentPage} of ${totalPages}</span>`;
        html += `<button ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="AdminOrdersManager.goToPage(${this.currentPage + 1})">Next →</button>`;
        container.innerHTML = html;
    },

    async updateStatus(orderId, newStatus) {
        try {
            const resp = await fetch(`${API_URL}/admin/orders/${orderId}/status/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ status: newStatus }),
            });
            if (!resp.ok) {
                const errData = await resp.json();
                showNotification(errData.detail || 'Failed to update status', 'error');
                return;
            }
            showNotification(`Order status updated to ${newStatus}`, 'success');
            await this.fetchOrders();
        } catch (err) {
            logger.error('Failed to update status:', err);
            showNotification('Failed to update order status', 'error');
        }
    },

    async refundOrder(orderId) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const reason = prompt(getT('refundReason') || 'Reason for refund:');
        if (reason === null) return;

        try {
            const resp = await fetch(`${API_URL}/admin/orders/${orderId}/refund/`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason }),
            });
            if (!resp.ok) {
                const errData = await resp.json();
                showNotification(errData.detail || 'Refund failed', 'error');
                return;
            }
            showNotification('Order refunded successfully.', 'success');
            await this.fetchOrders();
        } catch (err) {
            logger.error('Failed to refund order:', err);
            showNotification('Failed to process refund.', 'error');
        }
    },

    filterChanged() {
        this.currentStatus = document.getElementById('adminOrderStatusFilter').value;
        this.currentPage = 1;
        this.fetchOrders();
    },

    searchChanged() {
        this.searchQuery = document.getElementById('adminOrderSearch').value;
        this.currentPage = 1;
        this.fetchOrders();
    },

    goToPage(page) {
        this.currentPage = page;
        this.fetchOrders();
    },

    async exportCSV() {
        const params = new URLSearchParams();
        if (this.currentStatus) params.set('status', this.currentStatus);
        if (this.searchQuery) params.set('search', this.searchQuery);

        try {
            const resp = await fetch(`${API_URL}/admin/orders/export/?${params}`, {
                headers: { 'Authorization': `Bearer ${state.token || localStorage.getItem('accessToken')}` },
            });
            if (!resp.ok) throw new Error('Export failed');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'orders_export.csv';
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            logger.error('Failed to export orders:', err);
            showNotification('Failed to export orders.', 'error');
        }
    },

    editTracking(orderId) {
        const cell = document.getElementById(`tracking-${orderId}`);
        if (!cell) return;
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        cell.style.cursor = 'default';
        cell.onclick = null;
        cell.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <input type="text" id="trackNum-${orderId}" placeholder="${getT('trackingNumber') || 'Tracking #'}"
                    value="${order.tracking_number || ''}" style="width:120px;padding:2px 4px;font-size:11px;">
                <input type="text" id="trackCarrier-${orderId}" placeholder="${getT('carrier') || 'Carrier'}"
                    value="${order.carrier || ''}" style="width:120px;padding:2px 4px;font-size:11px;">
                <div style="display:flex;gap:4px;">
                    <button class="btn btn-primary btn-sm" style="padding:2px 8px;font-size:11px;"
                        onclick="AdminOrdersManager.saveTracking('${orderId}')">${getT('save') || 'Save'}</button>
                    <button class="btn btn-secondary btn-sm" style="padding:2px 8px;font-size:11px;"
                        onclick="AdminOrdersManager.cancelTracking('${orderId}')">${getT('cancel') || 'Cancel'}</button>
                </div>
            </div>
        `;
    },

    async saveTracking(orderId) {
        const trackingNumber = document.getElementById(`trackNum-${orderId}`).value;
        const carrier = document.getElementById(`trackCarrier-${orderId}`).value;

        try {
            const resp = await fetch(`${API_URL}/admin/orders/${orderId}/tracking/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ tracking_number: trackingNumber, carrier }),
            });
            if (!resp.ok) throw new Error('Update failed');
            showNotification('Tracking info updated.', 'success');
            await this.fetchOrders();
        } catch (err) {
            logger.error('Failed to update tracking:', err);
            showNotification('Failed to update tracking.', 'error');
        }
    },

    cancelTracking(orderId) {
        this.fetchOrders();
    },

    goBack() {
        this.hide();
    }
};

// Expose globally for onclick handlers
window.AdminOrdersManager = AdminOrdersManager;
