import { escapeHtml } from './ui-utils.js';
import { AddressManager } from './addresses.js';
import { CartManager } from './cart.js';
import { state } from './state.js';

export function renderAddresses() {
    const addressesGrid = document.getElementById('addressesGrid');
    if (!addressesGrid) return;
    addressesGrid.innerHTML = AddressManager.addresses.length ? AddressManager.addresses.map(a => `
        <div class="address-card">
            <div class="address-card-header">
                <div class="address-type-badge">
                    ${a.isDefault ? '<span class="badge badge-primary">Default</span>' : ''}
                    <span class="address-label">${escapeHtml(a.label)}</span>
                </div>
                <div class="address-actions">
                    <button class="btn-icon" onclick="window.editAddress('${a._id}')" aria-label="Edit address">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon delete-btn" onclick="window.deleteAddress('${a._id}')" aria-label="Delete address">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="address-card-body">
                <strong class="address-name">${escapeHtml(a.firstName)} ${escapeHtml(a.lastName)}</strong>
                <p class="address-line">${escapeHtml(a.street)}</p>
                <p class="address-line">${escapeHtml(a.city)}, ${escapeHtml(a.zip)}</p>
                <p class="address-line">${escapeHtml(a.country)}</p>
            </div>
        </div>
    `).join('') : `
        <div class="empty-state">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden="true" style="margin-bottom: 24px; color: var(--text-secondary);">
                <path d="M32 58s20-10 20-25V12L32 4 12 12v21c0 15 20 25 20 25z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="32" cy="28" r="8" stroke="currentColor" stroke-width="2"/>
            </svg>
            <h3>No addresses saved</h3>
            <p>Add an address for faster checkout</p>
        </div>
    `;
}

export function updateCheckoutSummary() {
    const subtotal = CartManager.getTotal();
    const shipping = subtotal > 75 ? 0 : 10;
    let discount = 0;
    if (state.currentCoupon) {
        if (state.currentCoupon.discountType === 'percentage') {
            discount = subtotal * (state.currentCoupon.discountValue / 100);
        } else {
            discount = state.currentCoupon.discountValue;
        }
    }
    const total = Math.max(0, subtotal + shipping - discount);
    const subtotalEl = document.getElementById('checkoutSubtotal'); if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    const shippingEl = document.getElementById('checkoutShipping'); if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
    const discountRow = document.getElementById('checkoutDiscountRow');
    const discountEl = document.getElementById('checkoutDiscount');
    if (discount > 0) {
        if (discountRow) discountRow.classList.remove('hidden');
        if (discountEl) discountEl.textContent = `- $${discount.toFixed(2)}`;
    } else {
        if (discountRow) discountRow.classList.add('hidden');
    }
    const totalEl = document.getElementById('checkoutTotal'); if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
    const items = document.getElementById('checkoutOrderItems');
    if (items) {
        if (state.cart.length === 0) {
            items.innerHTML = '<div class="checkout-empty">Your cart is empty</div>';
        } else {
            items.innerHTML = state.cart.map(i => `
        <div class="checkout-item">
            <img src="${i.image || 'https://via.placeholder.com/60x60?text=No+Image'}"
                alt="${escapeHtml(i.name)}"
                class="checkout-item-img"
                onerror="this.src='https://via.placeholder.com/60x60?text=No+Image'">
                <div class="checkout-item-info">
                    <div class="checkout-item-title">${escapeHtml(i.name)}</div>
                    <div class="checkout-item-meta">Quantity: ${i.quantity || 1}</div>
                    <div class="checkout-item-price">$${(i.price * (i.quantity || 1)).toFixed(2)}</div>
                </div>
            </div>
    `).join('');
        }
    }
}
