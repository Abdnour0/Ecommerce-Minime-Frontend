import { state, API_URL } from './state.js';
import { AuthManager } from './auth.js';
import { SettingsManager } from './settings.js';

const OrderManager = {
    async init() {
        try {
            // Load local first for immediate display/guest
            const storedOrders = localStorage.getItem('orders');
            state.orders = storedOrders ? JSON.parse(storedOrders) : [];

            // If logged in, fetch from backend
            if (AuthManager.isAuthenticated()) {
                await this.fetchOrders();
            }
        } catch (e) {
            console.error('Error loading orders:', e);
            state.orders = [];
        }
    },

    async fetchOrders() {
        try {
            const response = await fetch(`${API_URL}/orders`, {
                headers: AuthManager.getAuthHeader()
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.orders) {
                    state.orders = data.orders;
                    this.save();
                    return true;
                }
            }
        } catch (e) {
            console.error('Error fetching orders:', e);
        }
        return false;
    },

    async createOrder(orderData) {
        const trackingNumber = this.generateTrackingNumber();
        const order = {
            id: Date.now(),
            trackingNumber: trackingNumber,
            date: new Date().toISOString(),
            status: 'Processing',
            items: orderData.items,
            subtotal: orderData.subtotal,
            shipping: orderData.shipping,
            tax: orderData.tax,
            total: orderData.total,
            paymentMethod: orderData.paymentMethod,
            shippingAddress: orderData.shippingAddress,
            email: orderData.email,
            estimatedDelivery: this.calculateEstimatedDelivery()
        };

        // Try to save to backend
        try {
            if (state.token && state.token !== 'local-dummy-token') {
                const response = await fetch(`${API_URL}/orders`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        ...AuthManager.getAuthHeader()
                    },
                    body: JSON.stringify(order)
                });
                const data = await response.json();
                if (data.success && data.order) {
                    order.id = data.order._id || data.order.id || order.id;
                    order._id = data.order._id;
                }
            }
        } catch (e) {
            console.error('Error saving order to backend:', e);
        }

        // Always save locally as well
        state.orders.unshift(order);
        this.save();

        window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { orders: state.orders } }));
        return order;
    },

    generateTrackingNumber() {
        const prefix = 'MNM';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `${prefix}${timestamp}${random}`;
    },

    calculateEstimatedDelivery() {
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 5);
        return deliveryDate.toISOString();
    },

    getOrders() {
        return state.orders;
    },

    getOrderById(orderId) {
        return state.orders.find(order => (order._id === orderId) || (order.id == orderId));
    },

    save() {
        try {
            localStorage.setItem('orders', JSON.stringify(state.orders));
        } catch (e) {
            console.error('Error saving orders:', e);
        }
    },

    async cancelOrder(orderId) {
        try {
            if (AuthManager.isAuthenticated() && state.token !== 'local-dummy-token') {
                const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
                    method: 'PATCH',
                    headers: AuthManager.getAuthHeader()
                });
                const data = await response.json();
                if (data.success) {
                    await this.fetchOrders();
                    window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { orders: state.orders } }));
                    return { success: true };
                } else {
                    return { success: false, error: data.message || 'Failed to cancel order' };
                }
            } else {
                this.updateLocalStatus(orderId, 'Cancelled');
                return { success: true };
            }
        } catch (e) {
            console.error('Error cancelling order:', e);
            return { success: false, error: 'Network error. Please try again.' };
        }
    },

    updateLocalStatus(orderId, newStatus) {
        const order = this.getOrderById(orderId);
        if (order) {
            order.status = newStatus;
            this.save();
            window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { orders: state.orders } }));
        }
    },

    getStatusColor(status) {
        const colors = {
            'Processing': '#3B82F6',
            'Shipped': '#F37021',
            'Delivered': '#16A34A',
            'Cancelled': '#DC2626'
        };
        return colors[status] || '#626567';
    }
};

export function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList) return;

    const orders = OrderManager.getOrders();
    const noOrdersText = SettingsManager.getTranslation('noOrdersYet') || 'No orders yet';
    const startShoppingText = SettingsManager.getTranslation('startShoppingOrders') || 'Start shopping to see your orders here';
    const startShoppingBtn = SettingsManager.getTranslation('startShopping') || 'Start Shopping';

    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true">
                    <path d="M4 4h13.5l6.7 33.5a5 5 0 005 4h24.3a5 5 0 005-4L62 16H16" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
                    <circle cx="29" cy="56" r="4" stroke="currentColor" stroke-width="4"/>
                    <circle cx="49" cy="56" r="4" stroke="currentColor" stroke-width="4"/>
                </svg>
                <h3>${noOrdersText}</h3>
                <p>${startShoppingText}</p>
                <button class="btn btn-primary" onclick="window.showHomePage()">${startShoppingBtn}</button>
            </div>
        `;
        return;
    }

    ordersList.innerHTML = orders.map(order => {
        const orderDate = new Date(order.createdAt || order.date);
        const orderId = order._id || order.id;
        const statusKey = order.status.toLowerCase();
        const translatedStatus = SettingsManager.getTranslation(statusKey) || order.status;
        const statusColor = OrderManager.getStatusColor(order.status);
        const canCancel = order.status === 'Processing' || order.status === 'processing' || order.status === 'Pending';
        const isCancelled = order.status === 'Cancelled' || order.status === 'cancelled';

        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>Order #${String(orderId).slice(-8).toUpperCase()}</h3>
                        <p class="order-date">${orderDate.toLocaleDateString(SettingsManager.currentLanguage || 'en', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${canCancel ? `
                            <button class="btn-cancel-link-styled" onclick="(async () => {
                                try {
                                    const result = await window.OrderManager.cancelOrder('${orderId}');
                                    if (result && result.success) {
                                        window.showNotification('Order cancelled successfully.', 'success');
                                        window.renderOrders();
                                    } else {
                                        window.showNotification(result?.error || 'Failed to cancel order. Please try again.', 'error');
                                    }
                                } catch (error) {
                                    console.error('Error cancelling order:', error);
                                    window.showNotification('Failed to cancel order. Please try again.', 'error');
                                }
                            })()">
                                CANCEL ORDER
                            </button>
                        ` : ''}
                        <div class="order-status-badge ${isCancelled ? 'status-cancelled' : ''}" style="${!isCancelled ? `background-color: ${statusColor}15; color: ${statusColor}; border: 1px solid ${statusColor}30;` : ''}">
                            ${translatedStatus.toUpperCase()}
                        </div>
                    </div>
                </div>
                
                ${order.trackingNumber ? `
                <div class="order-tracking-row">
                    <div class="tracking-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 6h16M4 10h16M4 14h7M4 18h7" stroke-linecap="round"/>
                            <circle cx="18" cy="16" r="3"/>
                            <path d="M18 16l2 2"/>
                        </svg>
                    </div>
                    <div class="tracking-info">
                        <span class="tracking-label">YOUR TRACKING NUMBER IS</span>
                        <p class="tracking-number">${order.trackingNumber}</p>
                    </div>
                </div>
                ` : ''}
                
                <div class="order-items-list">
                    ${order.items && order.items.length > 0 ? order.items.map(item => `
                        <div class="order-item-detail">
                            <div class="item-thumbnail">
                                <img src="${item.image || 'https://via.placeholder.com/400x300'}" alt="${item.name || 'Product'}">
                            </div>
                            <div class="item-info">
                                <h4>${item.name || 'Product'}</h4>
                                <p class="item-meta">Quantity: ${item.quantity || 1}</p>
                                <p class="item-price">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</p>
                            </div>
                        </div>
                    `).join('') : ''}
                </div>
                
                <div class="order-footer-simple">
                     <p>Total: <strong>$${(order.total || 0).toFixed(2)}</strong></p>
                </div>
            </div>
        `;
    }).join('');
}

// Explicit exports to ensure they're available
export { OrderManager };
