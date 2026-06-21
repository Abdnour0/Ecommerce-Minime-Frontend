import { state } from './state.js';
import { AuthManager } from './auth.js';
import { CartManager } from './cart.js';
import { logger } from './logger.js';
import { SettingsManager } from './settings.js';
import { escapeHtml } from './ui-utils.js';
import { API_CONFIG, apiFetch } from './api-config.js';

export function prepareOrderData(paymentMethod, email) {
    // Get cart items - ensure they have all required fields for the API
    const cartItems = state.cart.map(item => ({
        product_id: item.id || item._id,
        quantity: item.quantity || 1,
        selected_size: item.selectedSize || item.size || '',
        selected_color: item.selectedColor || (item.colors && item.colors[0]?.name) || ''
    }));

    const subtotal = CartManager.getTotal();
    const shipping = 0;
    const tax = Math.round(subtotal * 0.1 * 100) / 100;
    const total = subtotal + shipping + tax;

    // Construct the address string for the simple backend field
    const addr = {
        line1: document.getElementById('address')?.value || '',
        city: document.getElementById('city')?.value || '',
        state: document.getElementById('state')?.value || '',
        postal_code: document.getElementById('zip')?.value || '',
        country: document.getElementById('country')?.value || 'US'
    };
    const shippingAddressString = `${addr.line1}, ${addr.city}, ${addr.state} ${addr.postal_code}, ${addr.country}`;

    return {
        items: cartItems,
        total_amount: total,
        payment_method: paymentMethod,
        shipping_address: shippingAddressString,
        payment_id: 'mock_pay_' + Date.now() // Simulation
    };
}

const OrderManager = {
    async init() {
        try {
            // Load local first as a fallback
            const storedOrders = localStorage.getItem('orders');
            state.orders = storedOrders ? JSON.parse(storedOrders) : [];

            // If logged in, fetch from backend (overwrites local)
            if (AuthManager.isAuthenticated()) {
                await this.fetchOrders();
            }
        } catch (e) {
            logger.error('Error loading orders:', e);
        }
    },

    async fetchOrders() {
        if (!AuthManager.isAuthenticated()) return false;
        try {
            const orders = await apiFetch(API_CONFIG.ENDPOINTS.ORDERS);
            state.orders = orders.map(order => ({
                ...order,
                date: order.created_at,
                // Map nested items for frontend display
                items: order.items.map(item => ({
                    ...item,
                    name: item.product_name,
                    image: 'https://via.placeholder.com/400x300' // Real app would have product image link
                }))
            }));
            this.save();
            window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { orders: state.orders } }));
            return true;
        } catch (error) {
            logger.error('Failed to fetch orders from API:', error);
            return false;
        }
    },

    async createOrder(orderData) {
        try {
            const createdOrder = await apiFetch(API_CONFIG.ENDPOINTS.ORDERS, {
                method: 'POST',
                body: JSON.stringify(orderData)
            });

            // Map the API response for the frontend state
            const frontendOrder = {
                ...createdOrder,
                date: createdOrder.created_at,
                items: createdOrder.items.map(item => ({
                    ...item,
                    name: item.product_name
                }))
            };

            state.orders.unshift(frontendOrder);
            this.save();

            window.dispatchEvent(new CustomEvent('ordersUpdated', { detail: { orders: state.orders } }));
            return frontendOrder;
        } catch (error) {
            logger.error('Failed to create order on server:', error);
            throw error; // Let the caller handle UI notification
        }
    },

    generateTrackingNumber() {
        // Now handled or replaced by server IDs, but kept for UI compatibility
        const prefix = 'MNM';
        const timestamp = Date.now().toString().slice(-8);
        return `${prefix}${timestamp}`;
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
        return state.orders.find(order => String(order.id) === String(orderId));
    },

    save() {
        try {
            localStorage.setItem('orders', JSON.stringify(state.orders));
        } catch (e) {
            logger.error('Error saving orders:', e);
        }
    },

    async cancelOrder(orderId) {
        try {
            const result = await apiFetch(`${API_CONFIG.ENDPOINTS.ORDERS}${orderId}/cancel/`, {
                method: 'POST'
            });
            await this.fetchOrders();
            return { success: true, order: result };
        } catch (error) {
            logger.error('Failed to cancel order:', error);
            return { success: false, error: error.message || 'Failed to cancel order.' };
        }
    },

    getStatusColor(status) {
        const s = String(status).toLowerCase();
        const colors = {
            'processing': '#3B82F6',
            'pending': '#F59E0B',
            'shipped': '#F37021',
            'delivered': '#16A34A',
            'cancelled': '#DC2626'
        };
        return colors[s] || '#626567';
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
                        <h3>Order #${escapeHtml(String(orderId).slice(-8).toUpperCase())}</h3>
                        <p class="order-date">${orderDate.toLocaleDateString(state.currentLanguage || 'en', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}</p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${canCancel ? `
                            <button class="btn-cancel-link-styled" data-cancel-order-id="${escapeHtml(orderId)}">
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
                        <p class="tracking-number">${escapeHtml(order.trackingNumber)}</p>
                    </div>
                </div>
                ` : ''}
                
                <div class="order-items-list">
                    ${order.items && order.items.length > 0 ? order.items.map(item => `
                        <div class="order-item-detail">
                            <div class="item-thumbnail">
                                <img src="${item.image || 'https://via.placeholder.com/400x300'}" alt="${escapeHtml(item.name || 'Product')}">
                            </div>
                            <div class="item-info">
                                <h4>${escapeHtml(item.name || 'Product')}</h4>
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
        logger.error('Error cancelling order:', error);
        showNotification('Failed to cancel order. Please try again.', 'error');
    }
});

// Explicit exports to ensure they're available
export { OrderManager };
