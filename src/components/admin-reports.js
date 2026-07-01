import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const AdminReportsManager = {
    days: 30,
    data: null,

    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminReportsPanel');
        if (existing) existing.remove();

        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminReportsPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminReportsPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminReportsPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('salesReports') || 'Sales Reports'}</h2>
                    <p>${getT('salesReportsDesc') || 'Revenue, orders, and customer analytics'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <select id="reportDays" onchange="AdminReportsManager.changeDays()" style="font-size:13px;padding:4px 8px;">
                        <option value="7" ${this.days === 7 ? 'selected' : ''}>${getT('last7Days') || 'Last 7 days'}</option>
                        <option value="30" ${this.days === 30 ? 'selected' : ''}>${getT('last30Days') || 'Last 30 days'}</option>
                        <option value="90" ${this.days === 90 ? 'selected' : ''}>${getT('last90Days') || 'Last 90 days'}</option>
                    </select>
                    <button class="btn btn-primary btn-sm" onclick="AdminReportsManager.downloadPDF()">
                        ↓ ${getT('downloadPDF') || 'Download PDF'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="AdminReportsManager.goBack()">
                        ← ${getT('backToDashboard') || 'Back to Dashboard'}
                    </button>
                </div>
            </div>
            <div id="reportsContent">
                <div class="loading-cell" style="padding:40px;text-align:center;">${getT('loading') || 'Loading...'}</div>
            </div>
        `;

        await this.fetchData();
    },

    changeDays() {
        this.days = parseInt(document.getElementById('reportDays').value) || 30;
        this.fetchData();
    },

    async fetchData() {
        const content = document.getElementById('reportsContent');
        if (!content) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        try {
            const resp = await fetch(`${API_URL}/admin/reports/?days=${this.days}`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            this.data = await resp.json();
            this.renderData();
        } catch (err) {
            logger.error('Failed to fetch reports:', err);
            content.innerHTML = `<div class="error-cell">${getT('loadError') || 'Failed to load reports.'}</div>`;
        }
    },

    renderData() {
        const content = document.getElementById('reportsContent');
        if (!content || !this.data) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const d = this.data;

        const arrow = (val) => val > 0 ? '↑' : val < 0 ? '↓' : '→';
        const color = (val) => val > 0 ? '#16A34A' : val < 0 ? '#DC2626' : '#78716C';

        content.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px;">
                <div class="stat-card" style="padding:16px;border-radius:8px;border:1px solid var(--border-color,#e5e5e5);">
                    <div style="font-size:11px;color:#78716C;text-transform:uppercase;letter-spacing:0.5px;">${getT('revenue') || 'Revenue'}</div>
                    <div style="font-size:24px;font-weight:700;margin:4px 0;">$${(d.revenue.current).toLocaleString()}</div>
                    <div style="font-size:12px;color:${color(d.revenue.change)};">
                        ${arrow(d.revenue.change)} ${Math.abs(d.revenue.change)}% ${getT('vsPrevious') || 'vs previous period'}
                    </div>
                </div>
                <div class="stat-card" style="padding:16px;border-radius:8px;border:1px solid var(--border-color,#e5e5e5);">
                    <div style="font-size:11px;color:#78716C;text-transform:uppercase;letter-spacing:0.5px;">${getT('orders') || 'Orders'}</div>
                    <div style="font-size:24px;font-weight:700;margin:4px 0;">${d.orders.current}</div>
                    <div style="font-size:12px;color:${color(d.orders.change)};">
                        ${arrow(d.orders.change)} ${Math.abs(d.orders.change)}% ${getT('vsPrevious') || 'vs previous period'}
                    </div>
                    <div style="font-size:11px;color:#78716C;margin-top:4px;">${getT('avgValue') || 'Avg'}: $${d.orders.avg_value}</div>
                </div>
                <div class="stat-card" style="padding:16px;border-radius:8px;border:1px solid var(--border-color,#e5e5e5);">
                    <div style="font-size:11px;color:#78716C;text-transform:uppercase;letter-spacing:0.5px;">${getT('newCustomers') || 'New Customers'}</div>
                    <div style="font-size:24px;font-weight:700;margin:4px 0;">${d.customers.new}</div>
                    <div style="font-size:12px;color:${color(d.customers.change)};">
                        ${arrow(d.customers.change)} ${Math.abs(d.customers.change)}%
                    </div>
                    <div style="font-size:11px;color:#78716C;margin-top:4px;">${getT('repeatRate') || 'Repeat'}: ${d.customers.repeat_rate}%</div>
                </div>
                <div class="stat-card" style="padding:16px;border-radius:8px;border:1px solid var(--border-color,#e5e5e5);">
                    <div style="font-size:11px;color:#78716C;text-transform:uppercase;letter-spacing:0.5px;">${getT('totalCustomers') || 'Total Customers'}</div>
                    <div style="font-size:24px;font-weight:700;margin:4px 0;">${d.customers.total}</div>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px;">
                <div style="border:1px solid var(--border-color,#e5e5e5);border-radius:8px;padding:16px;">
                    <h3 style="margin:0 0 12px;font-size:14px;">${getT('topProducts') || 'Top Products'}</h3>
                    <table class="admin-orders-table" style="font-size:13px;">
                        <thead><tr><th>#</th><th>${getT('product') || 'Product'}</th><th>${getT('sold') || 'Sold'}</th><th>${getT('revenue') || 'Revenue'}</th></tr></thead>
                        <tbody>
                            ${d.top_products.map((p, i) => `
                                <tr><td>${i+1}</td><td>${p.name}</td><td>${p.quantity}</td><td>$${p.revenue.toFixed(2)}</td></tr>
                            `).join('') || `<tr><td colspan="4" style="text-align:center;color:#78716C;">${getT('noData') || 'No data'}</td></tr>`}
                        </tbody>
                    </table>
                </div>
                <div style="border:1px solid var(--border-color,#e5e5e5);border-radius:8px;padding:16px;">
                    <h3 style="margin:0 0 12px;font-size:14px;">${getT('orderStatusDist') || 'Order Status'}</h3>
                    <table class="admin-orders-table" style="font-size:13px;">
                        <thead><tr><th>${getT('status') || 'Status'}</th><th>${getT('count') || 'Count'}</th></tr></thead>
                        <tbody>
                            ${d.order_status.labels.map((label, i) => `
                                <tr><td>${label}</td><td>${d.order_status.data[i]}</td></tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div style="border:1px solid var(--border-color,#e5e5e5);border-radius:8px;padding:16px;margin-bottom:16px;">
                <h3 style="margin:0 0 12px;font-size:14px;">${getT('dailyRevenue') || 'Daily Revenue'}</h3>
                <div style="display:flex;align-items:flex-end;gap:2px;height:120px;overflow-x:auto;padding-bottom:8px;">
                    ${d.revenue.daily.map(day => {
                        const maxRev = Math.max(...d.revenue.daily.map(r => r.total), 1);
                        const pct = (day.total / maxRev) * 100;
                        return `<div style="display:flex;flex-direction:column;align-items:center;min-width:30px;">
                            <div style="width:20px;background:#B88E2F;border-radius:3px 3px 0 0;height:${pct}%;min-height:2px;" title="$${day.total.toFixed(2)}"></div>
                            <span style="font-size:9px;color:#78716C;margin-top:4px;transform:rotate(-45deg);white-space:nowrap;">${day.date.slice(5,10)}</span>
                        </div>`;
                    }).join('') || `<div style="color:#78716C;">${getT('noData') || 'No data'}</div>`}
                </div>
            </div>
        `;
    },

    async downloadPDF() {
        const token = state.token || localStorage.getItem('accessToken');
        try {
            const resp = await fetch(`${API_URL}/admin/reports/download/?days=${this.days}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!resp.ok) throw new Error('Download failed');
            const html = await resp.text();
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(html);
                win.document.close();
                win.focus();
                win.print();
            } else {
                showNotification('Please allow popups to download the report.', 'error');
            }
        } catch (err) {
            logger.error('Failed to download report:', err);
            showNotification('Failed to download report.', 'error');
        }
    },

    goBack() {
        this.hide();
    }
};

window.AdminReportsManager = AdminReportsManager;
