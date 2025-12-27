import translations from './translations.js';
import { state } from './state.js';
import { SettingsManager } from './settings.js';

export const DashboardManager = {
    charts: {},
    isInitialized: false,

    init() {
        if (this.isInitialized) return;
        if (typeof Chart === 'undefined') {
            console.warn('Chart.js not loaded');
            return;
        }
        this.initCharts();
        this.updateDashboard();
        this.renderRecentOrders(); // Initial render
        this.isInitialized = true;
    },

    initCharts() {
        Chart.defaults.font.family = 'Inter';
        Chart.defaults.color = '#626567';

        // Revenue Line Chart
        this.charts.revenue = new Chart(document.getElementById('revenueChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue',
                    data: [],
                    borderColor: '#F37021',
                    backgroundColor: 'rgba(243, 112, 33, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Revenue Trend' },
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#E5E5E4' } },
                    x: { grid: { display: false } }
                }
            }
        });

        // Category Bar Chart
        this.charts.category = new Chart(document.getElementById('categoryChart'), {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sales',
                    data: [],
                    backgroundColor: ['#212A2F', '#F37021', '#626567'],
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Sales by Category' },
                    legend: { display: false }
                }
            }
        });

        // Status Pie Chart
        this.charts.status = new Chart(document.getElementById('statusChart'), {
            type: 'pie',
            data: {
                labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
                datasets: [{
                    data: [],
                    backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#EF4444']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Order Status' }
                }
            }
        });

        // Payment Donut Chart
        this.charts.payment = new Chart(document.getElementById('paymentChart'), {
            type: 'doughnut',
            data: {
                labels: ['Credit Card', 'PayPal', 'Apple Pay'],
                datasets: [{
                    data: [],
                    backgroundColor: ['#212A2F', '#0070BA', '#000000']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Payment Methods' }
                }
            }
        });

        // Volume Area Chart
        this.charts.volume = new Chart(document.getElementById('volumeChart'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Order Volume',
                    data: [],
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Order Volume' },
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true },
                    x: { grid: { display: false } }
                }
            }
        });
    },

    updateDashboard() {
        const periodEl = document.getElementById('dashboardPeriod');
        const categoryEl = document.getElementById('dashboardCategory');
        if (!periodEl || !categoryEl) return;

        const period = periodEl.value;
        const category = categoryEl.value;
        const data = this.generateData(period, category);

        // Refresh recent orders too
        this.renderRecentOrders();

        // Translations
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        // Update Chart Titles
        if (this.charts.revenue) this.charts.revenue.options.plugins.title.text = getT('revenueTrend');
        if (this.charts.category) this.charts.category.options.plugins.title.text = getT('salesByCategory');
        if (this.charts.status) this.charts.status.options.plugins.title.text = getT('orderStatus');
        if (this.charts.payment) this.charts.payment.options.plugins.title.text = getT('paymentMethods');
        if (this.charts.volume) this.charts.volume.options.plugins.title.text = getT('orderVolume');

        // Update KPIs
        this.animateValue('kpiRevenue', data.kpis.revenue, '$');
        this.animateValue('kpiOrders', data.kpis.orders, '');
        this.animateValue('kpiCustomers', data.kpis.customers, '');
        this.animateValue('kpiProducts', data.kpis.products, '');
        this.animateValue('kpiPending', data.kpis.pending, '');
        this.animateValue('kpiAvgValue', data.kpis.avgOrder, '$');

        // Update Charts Data
        this.updateChart(this.charts.revenue, data.charts.revenue.labels, data.charts.revenue.data);
        this.updateChart(this.charts.category, data.charts.category.labels, data.charts.category.data);
        this.updateChart(this.charts.status, data.charts.status.labels, data.charts.status.data);
        this.updateChart(this.charts.payment, data.charts.payment.labels, data.charts.payment.data);
        this.updateChart(this.charts.volume, data.charts.volume.labels, data.charts.volume.data);
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
        el.innerText = prefix + value.toLocaleString();
    },

    renderRecentOrders() {
        const recentOrdersContainer = document.getElementById('dashRecentOrders');
        if (!recentOrdersContainer) return;

        // Ensure OrderManager is available
        const orders = (window.OrderManager && window.OrderManager.getOrders()) || state.orders || [];

        if (orders.length === 0) {
            recentOrdersContainer.innerHTML = `
                <div class="empty-state-small">
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
                        <path d="M4 4h10l5 25a4 4 0 004 3h18a4 4 0 004-3L48 12H12" stroke="currentColor"
                            stroke-width="3" stroke-linecap="round" />
                        <circle cx="21" cy="42" r="3" stroke="currentColor" stroke-width="3" />
                        <circle cx="37" cy="42" r="3" stroke="currentColor" stroke-width="3" />
                    </svg>
                    <p>${translations[state.currentLanguage]?.noRecentOrders || 'No recent orders'}</p>
                </div>
            `;
            return;
        }

        // Take top 3 most recent orders
        const recentOrders = orders.slice(0, 3);

        recentOrdersContainer.innerHTML = recentOrders.map(order => {
            const firstItem = order.items && order.items[0];
            const itemImage = firstItem?.image || 'https://via.placeholder.com/80';
            const itemCount = order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0;
            const statusColor = this.getStatusColor(order.status);
            const orderDate = new Date(order.createdAt || order.date).toLocaleDateString();

            return `
                <div class="recent-order-item" onclick="window.showOrdersPage()">
                    <div class="ro-image">
                        <img src="${itemImage}" alt="Order Item">
                    </div>
                    <div class="ro-info">
                        <h4>Order #${String(order._id || order.id).slice(-8).toUpperCase()}</h4>
                        <p>${orderDate} • ${itemCount} items</p>
                    </div>
                    <div class="ro-status">
                        <span class="status-badge-small" style="background-color: ${statusColor}15; color: ${statusColor};">
                            ${order.status}
                        </span>
                    </div>
                    <div class="ro-total">
                        <strong>$${(order.total || 0).toFixed(2)}</strong>
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
    },

    generateData(period, category) {
        let multiplier = period === '7' ? 0.3 : (period === '30' ? 1 : 12);
        if (category !== 'all') multiplier *= 0.6;

        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        const labels = period === '7'
            ? [getT('mon'), getT('tue'), getT('wed'), getT('thu'), getT('fri'), getT('sat'), getT('sun')]
            : [getT('week') + ' 1', getT('week') + ' 2', getT('week') + ' 3', getT('week') + ' 4'];

        const catLabels = [getT('men'), getT('women'), getT('accessories')];
        const statusLabels = [getT('pending'), getT('processing'), getT('shipped'), getT('delivered'), getT('cancelled')];
        const paymentLabels = [getT('creditCard'), getT('paypal'), getT('applePay')];

        return {
            kpis: {
                revenue: Math.floor(12500 * multiplier + Math.random() * 1000),
                orders: Math.floor(150 * multiplier + Math.random() * 20),
                customers: Math.floor(45 * multiplier),
                products: Math.floor(320 * multiplier),
                pending: Math.floor(Math.random() * 15),
                avgOrder: Math.floor(85 + Math.random() * 10)
            },
            charts: {
                revenue: {
                    labels: labels,
                    data: labels.map(() => Math.floor(Math.random() * 3000 * multiplier))
                },
                category: {
                    labels: catLabels,
                    data: [Math.floor(50 * multiplier), Math.floor(65 * multiplier), Math.floor(30 * multiplier)]
                },
                status: {
                    labels: statusLabels,
                    data: [5, 12, 40, 85, 2].map(v => Math.floor(v * multiplier * 0.1))
                },
                payment: {
                    labels: paymentLabels,
                    data: [60, 30, 10]
                },
                volume: {
                    labels: labels,
                    data: labels.map(() => Math.floor(Math.random() * 20 * multiplier))
                }
            }
        };
    }
};

export function showDashboardPage() {
    const dashboardPage = document.getElementById('dashboardPage');
    if (dashboardPage) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
        dashboardPage.classList.add('active');
        DashboardManager.init();
    }
}
