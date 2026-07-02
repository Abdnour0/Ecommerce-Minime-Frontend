import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';
import { hasDashboardAccess } from './dashboard-access.js';
import { AdminOrdersManager } from './admin-orders.js';
import { AdminProductsManager } from './admin-products.js';
import { AdminUsersManager } from './admin-users.js';
import { AdminReviewsManager } from './admin-reviews.js';
import { AdminCouponsManager } from './admin-coupons.js';
import { AdminReportsManager } from './admin-reports.js';
import { AdminActivityLogManager } from './admin-activity-log.js';
import { AdminEmailTemplatesManager } from './admin-email-templates.js';
import { AdminWishlistManager } from './admin-wishlist.js';

window.AdminOrdersManager = AdminOrdersManager;
window.AdminProductsManager = AdminProductsManager;
window.AdminUsersManager = AdminUsersManager;
window.AdminReviewsManager = AdminReviewsManager;
window.AdminCouponsManager = AdminCouponsManager;
window.AdminReportsManager = AdminReportsManager;
window.AdminActivityLogManager = AdminActivityLogManager;
window.AdminEmailTemplatesManager = AdminEmailTemplatesManager;
window.AdminWishlistManager = AdminWishlistManager;

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const DashboardManager = {
    charts: {},
    isInitialized: false,

    init() {
        if (this.isInitialized) return;
        if (typeof Chart === 'undefined') {
            logger.warn('Chart.js not loaded');
            return;
        }
        this.initCharts();
        this.updateDashboard();
        this.isInitialized = true;
    },

    initCharts() {
        Chart.defaults.font.family = 'Inter';
        Chart.defaults.color = '#626567';

        this.charts.revenue = new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Revenue', data: [], borderColor: '#F37021', backgroundColor: 'rgba(243, 112, 33, 0.1)', tension: 0.4, fill: true }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Revenue Trend' }, legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: '#E5E5E4' } }, x: { grid: { display: false } } } }
        });

        this.charts.category = new Chart(document.getElementById('categoryChart'), {
            type: 'bar',
            data: { labels: [], datasets: [{ label: 'Sales', data: [], backgroundColor: ['#212A2F', '#F37021', '#626567'], borderRadius: 4 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Sales by Category' }, legend: { display: false } } }
        });

        this.charts.status = new Chart(document.getElementById('statusChart'), {
            type: 'pie',
            data: { labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], datasets: [{ data: [], backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Order Status' } } }
        });

        this.charts.payment = new Chart(document.getElementById('paymentChart'), {
            type: 'doughnut',
            data: { labels: [], datasets: [{ data: [], backgroundColor: ['#212A2F', '#0070BA', '#000000'] }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Payment Methods' } } }
        });

        this.charts.volume = new Chart(document.getElementById('volumeChart'), {
            type: 'line',
            data: { labels: [], datasets: [{ label: 'Order Volume', data: [], borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: 'Order Volume' }, legend: { display: false } }, scales: { y: { beginAtZero: true }, x: { grid: { display: false } } } }
        });
    },

    async updateDashboard() {
        const periodEl = document.getElementById('dashboardPeriod');
        const categoryEl = document.getElementById('dashboardCategory');
        if (!periodEl || !categoryEl) return;

        const period = periodEl.value;
        const category = categoryEl.value;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        // Update Chart Titles by language
        if (this.charts.revenue) this.charts.revenue.options.plugins.title.text = getT('revenueTrend');
        if (this.charts.category) this.charts.category.options.plugins.title.text = getT('salesByCategory');
        if (this.charts.status) this.charts.status.options.plugins.title.text = getT('orderStatus');
        if (this.charts.payment) this.charts.payment.options.plugins.title.text = getT('paymentMethods');
        if (this.charts.volume) this.charts.volume.options.plugins.title.text = getT('orderVolume');

        try {
            const [dashboardData, recentOrdersData, lowStockData] = await Promise.all([
                this._fetchApi(`admin/dashboard/?period=${period}&category=${category}`),
                this._fetchApi('admin/dashboard/recent-orders/'),
                this._fetchApi('admin/dashboard/low-stock/')
            ]);

            // Update KPIs
            if (dashboardData?.stats) {
                const s = dashboardData.stats;
                this.animateValue('kpiRevenue', s.total_revenue, '$');
                this.animateValue('kpiOrders', s.total_orders, '');
                this.animateValue('kpiCustomers', s.total_customers, '');
                this.animateValue('kpiProducts', s.products_sold, '');
                this.animateValue('kpiPending', s.pending_orders, '');
                this.animateValue('kpiAvgValue', s.avg_order_value, '$');
                this.animateValue('kpiLowStock', s.low_stock_count, '');
            }

            // Render Low Stock
            this.renderLowStock(lowStockData?.products || []);

            // Update Charts
            if (dashboardData?.revenue) {
                this.updateChart(this.charts.revenue, dashboardData.revenue.labels, dashboardData.revenue.data);
            }
            if (dashboardData?.category_sales) {
                this.updateChart(this.charts.category, dashboardData.category_sales.labels, dashboardData.category_sales.data);
            }
            if (dashboardData?.order_status) {
                this.updateChart(this.charts.status, dashboardData.order_status.labels, dashboardData.order_status.data);
            }
            if (dashboardData?.payment_methods) {
                this.updateChart(this.charts.payment, dashboardData.payment_methods.labels, dashboardData.payment_methods.data);
            }
            if (dashboardData?.order_volume) {
                this.updateChart(this.charts.volume, dashboardData.order_volume.labels, dashboardData.order_volume.data);
            }

            // Update Recent Orders
            this.renderRecentOrders(recentOrdersData?.orders || []);

        } catch (err) {
            logger.error('Dashboard API error:', err);
            this.animateValue('kpiRevenue', 0, '$');
            this.animateValue('kpiOrders', 0, '');
            this.animateValue('kpiCustomers', 0, '');
            this.animateValue('kpiProducts', 0, '');
            this.animateValue('kpiPending', 0, '');
            this.animateValue('kpiAvgValue', 0, '$');
            this.renderRecentOrders([]);
        }
    },

    async _fetchApi(path) {
        const resp = await fetch(`${API_URL}/${path}`, { headers: getAuthHeaders() });
        if (!resp.ok) {
            if (resp.status === 403) {
                showNotification('Access denied. Admin privileges required.', 'error');
            }
            throw new Error(`API error: ${resp.status}`);
        }
        return resp.json();
    },

    updateChart(chart, labels, data) {
        if (!chart) return;
        if (labels) chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
    },

    animateValue(id, value, prefix = '') {
        const el = document.getElementById(id);
        if (!el) return;
        el.innerText = prefix + Number(value).toLocaleString(undefined, { minimumFractionDigits: prefix === '$' ? 2 : 0, maximumFractionDigits: prefix === '$' ? 2 : 0 });
    },

    renderRecentOrders(orders) {
        const container = document.getElementById('dashRecentOrders');
        if (!container) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        if (!orders || orders.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                        <path d="M4 4h10l5 25a4 4 0 004 3h18a4 4 0 004-3L48 12H12" stroke="currentColor"
                            stroke-width="3" stroke-linecap="round" />
                        <circle cx="21" cy="42" r="3" stroke="currentColor" stroke-width="3" />
                        <circle cx="37" cy="42" r="3" stroke="currentColor" stroke-width="3" />
                    </svg>
                    <p>${getT('noRecentOrders') || 'No recent orders'}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = orders.slice(0, 5).map(order => {
            const statusColor = this.getStatusColor(order.status);
            const orderDate = new Date(order.created_at).toLocaleDateString();

            return `
                <div class="recent-order-item" onclick="window.showOrdersPage()">
                    <div class="ro-image">
                        ${order.item_image
                            ? `<img src="${order.item_image}" alt="Order Item">`
                            : `<div class="ro-image-placeholder"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/></svg></div>`
                        }
                    </div>
                    <div class="ro-info">
                        <h4>Order #${order.id.slice(-8).toUpperCase()}</h4>
                        <p>${orderDate} • ${order.items_count} items • ${order.user}</p>
                    </div>
                    <div class="ro-status">
                        <span class="status-badge-small" style="background-color: ${statusColor}15; color: ${statusColor};">
                            ${order.status}
                        </span>
                    </div>
                    <div class="ro-total">
                        <strong>$${Number(order.total).toFixed(2)}</strong>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderLowStock(products) {
        const container = document.getElementById('dashLowStockList');
        const card = document.getElementById('lowStockCard');
        if (!container) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        if (!products || products.length === 0) {
            if (card) card.style.display = 'none';
            return;
        }

        if (card) card.style.display = '';
        container.innerHTML = products.slice(0, 5).map(p => {
            const urgency = p.stock < 5 ? '#DC2626' : '#F37021';
            return `
                <div class="recent-order-item" onclick="AdminProductsManager.show()">
                    <div class="ro-image" style="background:${urgency}10;border-color:${urgency}30;">
                        <span style="color:${urgency};font-weight:700;font-size:18px;">${p.stock}</span>
                    </div>
                    <div class="ro-info">
                        <h4>${p.name}</h4>
                        <p>${p.category} • $${p.price.toFixed(2)}</p>
                    </div>
                    <div class="ro-status">
                        <span class="status-badge-small" style="background-color:${urgency}15;color:${urgency};">
                            ${p.stock < 5 ? getT('critical') || 'Critical' : getT('lowStock') || 'Low Stock'}
                        </span>
                    </div>
                    <div class="ro-total">
                        <strong style="color:${urgency};">${p.stock} left</strong>
                    </div>
                </div>
            `;
        }).join('');
    },

    getStatusColor(status) {
        const colors = {
            'Processing': '#3B82F6',
            'Shipped': '#F37021',
            'Delivered': '#16A34A',
            'Cancelled': '#DC2626',
            'Pending': '#EAB308'
        };
        return colors[status] || '#626567';
    }
};

export function showDashboardPage() {
    if (!hasDashboardAccess()) {
        showAccessDeniedPage();
        return;
    }

    const dashboardPage = document.getElementById('dashboardPage');
    if (dashboardPage) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        dashboardPage.classList.add('active');
        if (window._loadChartJS) window._loadChartJS();
        DashboardManager.isInitialized = false;
        DashboardManager.init();
    }
}

export function showAccessDeniedPage() {
    const accessDeniedPage = document.getElementById('accessDeniedPage');
    if (accessDeniedPage) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        accessDeniedPage.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        window.showHomePage();
        showNotification('Access denied. You do not have permission to view this page.', 'error');
    }
}
