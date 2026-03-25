import { state } from './state.js';
import { AuthManager } from './auth.js';
import { SettingsManager } from './settings.js';
import { CartManager } from './cart.js';
import { showNotification } from './ui-utils.js';

export function prepareOrderData(paymentMethod, email) {
    // Get cart items - ensure they have all required fields
    const cartItems = state.cart.map(item => ({
        id: item.id || item._id,
        name: item.name || 'Product',
        price: item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || 'https://via.placeholder.com/400x300'
    }));

    const subtotal = CartManager.getTotal();
    const shipping = 0; // Free shipping or calculate if needed
    const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax (adjust as needed)
    const total = subtotal + shipping + tax;

    return {
        items: cartItems,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        total: total,
        paymentMethod: paymentMethod,
        shippingAddress: {
            line1: document.getElementById('address')?.value || '',
            city: document.getElementById('city')?.value || '',
            state: document.getElementById('state')?.value || '',
            postal_code: document.getElementById('zip')?.value || '',
            country: document.getElementById('country')?.value || 'US'
        },
        email: email
    };
}

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
        return true;
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
            this.updateLocalStatus(orderId, 'Cancelled');
            return { success: true };
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
                            <button class="btn-cancel-link-styled" data-cancel-order-id="${orderId}">
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

// Event delegation for cancel buttons (attached once at module load time)
document.addEventListener('click', async (e) => {
    const ordersList = document.getElementById('ordersList');
    if (!ordersList || !ordersList.contains(e.target)) return;

    const btn = e.target.closest('[data-cancel-order-id]');
    if (!btn) return;

    const orderId = btn.dataset.cancelOrderId;
    try {
        const result = await OrderManager.cancelOrder(orderId);
        if (result && result.success) {
            showNotification('Order cancelled successfully.', 'success');
            renderOrders();
        } else {
            showNotification(result?.error || 'Failed to cancel order. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error cancelling order:', error);
        showNotification('Failed to cancel order. Please try again.', 'error');
    }
});

// Explicit exports to ensure they're available
export { OrderManager };
