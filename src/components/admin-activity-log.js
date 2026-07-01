import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const AdminActivityLogManager = {
    currentPage: 1,
    contentFilter: '',
    actionFilter: '',
    searchQuery: '',

    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminActivityLogPanel');
        if (existing) existing.remove();

        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminActivityLogPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminActivityLogPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminActivityLogPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('activityLog') || 'Activity Log'}</h2>
                    <p>${getT('activityLogDesc') || 'Track all admin actions'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-secondary btn-sm" onclick="AdminActivityLogManager.goBack()">
                        ← ${getT('backToDashboard') || 'Back to Dashboard'}
                    </button>
                </div>
            </div>
            <div class="admin-orders-filters">
                <select id="logContentFilter" onchange="AdminActivityLogManager.filterChanged()">
                    <option value="">${getT('allTypes') || 'All Types'}</option>
                    <option value="order">${getT('orders') || 'Orders'}</option>
                    <option value="product">${getT('products') || 'Products'}</option>
                    <option value="user">${getT('users') || 'Users'}</option>
                    <option value="review">${getT('reviews') || 'Reviews'}</option>
                    <option value="coupon">${getT('coupons') || 'Coupons'}</option>
                </select>
                <select id="logActionFilter" onchange="AdminActivityLogManager.filterChanged()">
                    <option value="">${getT('allActions') || 'All Actions'}</option>
                    <option value="create">${getT('created') || 'Created'}</option>
                    <option value="update">${getT('updated') || 'Updated'}</option>
                    <option value="delete">${getT('deleted') || 'Deleted'}</option>
                </select>
                <input type="text" id="logSearch" placeholder="${getT('searchLogs') || 'Search logs...'}"
                    onkeydown="if(event.key==='Enter') AdminActivityLogManager.searchChanged()">
                <button class="btn btn-primary btn-sm" onclick="AdminActivityLogManager.searchChanged()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    ${getT('search') || 'Search'}
                </button>
            </div>
            <div class="admin-orders-table-wrap">
                <table class="admin-orders-table">
                    <thead>
                        <tr>
                            <th>${getT('time') || 'Time'}</th>
                            <th>${getT('admin') || 'Admin'}</th>
                            <th>${getT('action') || 'Action'}</th>
                            <th>${getT('type') || 'Type'}</th>
                            <th>${getT('item') || 'Item'}</th>
                            <th>${getT('details') || 'Details'}</th>
                        </tr>
                    </thead>
                    <tbody id="adminActivityLogBody">
                        <tr><td colspan="6" class="loading-cell">${getT('loading') || 'Loading...'}</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="adminActivityLogPagination" class="admin-orders-pagination"></div>
        `;

        await this.fetchLogs();
    },

    async fetchLogs() {
        const tbody = document.getElementById('adminActivityLogBody');
        if (!tbody) return;

        const params = new URLSearchParams({ page: this.currentPage });
        if (this.contentFilter) params.set('content_type', this.contentFilter);
        if (this.actionFilter) params.set('action', this.actionFilter);
        if (this.searchQuery) params.set('search', this.searchQuery);

        try {
            const resp = await fetch(`${API_URL}/admin/activity-log/?${params}`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();
            this.renderTable(data.logs);
            this.renderPagination(data);
        } catch (err) {
            logger.error('Failed to fetch activity log:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="6" class="error-cell">${translations[state.currentLanguage]?.loadError || 'Failed to load logs.'}</td></tr>`;
        }
    },

    renderTable(logs) {
        const tbody = document.getElementById('adminActivityLogBody');
        if (!tbody) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        if (logs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="empty-cell">${getT('noLogsFound') || 'No activity logs found.'}</td></tr>`;
            return;
        }

        const actionColors = { create: '#DCFCE7', update: '#DBEAFE', delete: '#FEE2E2' };
        const actionTextColors = { create: '#16A34A', update: '#2563EB', delete: '#DC2626' };

        tbody.innerHTML = logs.map(log => {
            const detailsHtml = log.details && Object.keys(log.details).length
                ? Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join('<br>')
                : '-';
            return `
            <tr>
                <td style="white-space:nowrap;font-size:12px;">${new Date(log.created_at).toLocaleString()}</td>
                <td>${log.actor}</td>
                <td><span class="status-badge-small" style="background:${actionColors[log.action] || '#F3F4F6'};color:${actionTextColors[log.action] || '#374151'}">${log.action_label}</span></td>
                <td>${log.content_type_label}</td>
                <td style="max-width:200px;white-space:normal;word-break:break-word;">${log.object_repr || log.object_id}</td>
                <td style="max-width:250px;white-space:normal;word-break:break-word;font-size:12px;">${detailsHtml}</td>
            </tr>
        `}).join('');
    },

    renderPagination(data) {
        const container = document.getElementById('adminActivityLogPagination');
        if (!container) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const totalPages = Math.ceil(data.total / data.page_size);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        container.innerHTML = `
            <button ${this.currentPage <= 1 ? 'disabled' : ''} onclick="AdminActivityLogManager.goToPage(${this.currentPage - 1})">← ${getT('prev') || 'Prev'}</button>
            <span>${getT('page') || 'Page'} ${this.currentPage} ${getT('of') || 'of'} ${totalPages}</span>
            <button ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="AdminActivityLogManager.goToPage(${this.currentPage + 1})">${getT('next') || 'Next'} →</button>
        `;
    },

    filterChanged() {
        this.contentFilter = document.getElementById('logContentFilter').value;
        this.actionFilter = document.getElementById('logActionFilter').value;
        this.currentPage = 1;
        this.fetchLogs();
    },

    searchChanged() {
        this.searchQuery = document.getElementById('logSearch').value;
        this.currentPage = 1;
        this.fetchLogs();
    },

    goToPage(page) {
        this.currentPage = page;
        this.fetchLogs();
    },

    goBack() {
        this.hide();
    }
};

window.AdminActivityLogManager = AdminActivityLogManager;
