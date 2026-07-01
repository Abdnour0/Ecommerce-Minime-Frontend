import { logger } from './logger.js';
import { state } from './state.js';
import { SettingsManager } from './settings.js';
import { showNotification } from './ui-utils.js';
import { apiFetch, API_CONFIG } from './api-config.js';

export const CartManager = {
    init() {
        try {
            state.cart = JSON.parse(localStorage.getItem('cart')) || [];
        } catch (e) {
            logger.error('Error loading cart:', e);
            state.cart = [];
        }
    },

    add(productId) {
        logger.log('CartManager.add called with productId:', productId);
        logger.log('Current products:', state.products?.length || 0);
        logger.log('Current cart:', state.cart?.length || 0);
        
        if (!productId) {
            logger.error('CartManager.add: productId is required');
            showNotification('Product ID is missing', 'error');
            return;
        }
        if (!state.products || state.products.length === 0) {
            logger.error('CartManager.add: No products available');
            showNotification('Products are still loading, please try again', 'error');
            return;
        }
        
        const product = state.products.find(p => {
            const pId = String(p.id || p._id);
            const searchId = String(productId);
            return pId === searchId;
        });
        
        if (!product) {
            logger.error('CartManager.add: Product not found', {
                searchedId: productId,
                availableIds: state.products.map(p => p.id || p._id),
                products: state.products
            });
            showNotification('Product not found', 'error');
            return;
        }
        
        logger.log('Product found:', product.name, product.id || product._id);
        
        const existingItemIndex = state.cart.findIndex(item => {
            const itemId = String(item.id || item._id);
            const searchId = String(productId);
            return itemId === searchId;
        });
        
        if (existingItemIndex !== -1) {
            state.cart[existingItemIndex].quantity = (state.cart[existingItemIndex].quantity || 1) + 1;
            logger.log('Updated existing cart item quantity:', state.cart[existingItemIndex].quantity);
        } else {
            state.cart.push({ ...product, quantity: 1 });
            logger.log('Added new item to cart:', product.name);
        }
        
        this.save();
        this.update();
        this.showAddedNotification(product.name);
        this.animateBadge();
        logger.log('Cart updated successfully. Total items:', this.getItemCount());
    },

    addWithAnimation(productId, element) {
        this.flyToCart(element);
        this.add(productId);
    },

    remove(productId) {
        const index = state.cart.findIndex(item => String(item.id || item._id) === String(productId));
        if (index !== -1) {
            state.cart.splice(index, 1);
            this.save();
            this.update();
        }
    },

    updateQuantity(productId, change) {
        const index = state.cart.findIndex(item => String(item.id || item._id) === String(productId));
        if (index !== -1) {
            state.cart[index].quantity = (state.cart[index].quantity || 1) + change;
            if (state.cart[index].quantity <= 0) {
                this.remove(productId);
            } else {
                this.save();
                this.update();
            }
        }
    },

    _syncTimeout: null,

    save() {
        try {
            localStorage.setItem('cart', JSON.stringify(state.cart));
        } catch (e) {
            logger.error('Error saving cart:', e);
            showNotification('Unable to save cart', 'error');
        }
        this.syncToServer();
    },

    syncToServer() {
        if (this._syncTimeout) clearTimeout(this._syncTimeout);
        if (!state.currentUser || !state.cart || state.cart.length === 0) return;

        this._syncTimeout = setTimeout(async () => {
            try {
                const items = state.cart.map(item => ({
                    product_id: item.id || item._id,
                    quantity: item.quantity || 1,
                    price: item.price,
                    name: item.name,
                    image: item.image,
                }));
                await apiFetch('/cart/sync/', {
                    method: 'POST',
                    body: JSON.stringify({ items }),
                });
            } catch (e) {
                // Silently fail — cart is still saved locally
                logger.warn('Cart sync to server failed:', e);
            }
        }, 2000);
    },

    update() {
        // Dispatch event for UI to update (avoids circular dependency with ui-handlers)
        window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart: state.cart } }));
    },

    showAddedNotification(productName) {
        const addedText = SettingsManager.getTranslation('addedToCart') || 'added to cart';
        showNotification(`✓ ${productName} ${addedText}`, 'success');
    },

    getTotal() {
        return state.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    },

    getItemCount() {
        return state.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    },

    flyToCart(element) {
        const rect = element.getBoundingClientRect();
        const cartBtn = document.getElementById('cartBtn');
        if (!cartBtn) return;
        const targetRect = cartBtn.getBoundingClientRect();
        const clone = element.cloneNode(true);
        clone.classList.add('fly-clone');
        clone.style.left = rect.left + 'px';
        clone.style.top = rect.top + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.setProperty('--fly-x', (targetRect.left - rect.left) + 'px');
        clone.style.setProperty('--fly-y', (targetRect.top - rect.top) + 'px');
        document.body.appendChild(clone);
        clone.addEventListener('animationend', () => clone.remove());
    },

    animateBadge() {
        const badge = document.getElementById('cartCount');
        if (badge) {
            badge.classList.remove('pop');
            void badge.offsetWidth;
            badge.classList.add('pop');
        }
    },

    clear() {
        state.cart = [];
        this.save();
        this.update();
    }
};
