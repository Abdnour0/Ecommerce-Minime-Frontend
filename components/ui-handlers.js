import { state, API_URL } from './state.js';
import { AuthManager } from './auth.js';
import { CartManager } from './cart.js';
import { OrderManager } from './orders.js';
import { SettingsManager } from './settings.js';
import { AddressManager } from './addresses.js';
import { showNotification, escapeHtml } from './ui-utils.js';
import { showPage } from './pages.js';

export function openAccountModal() {
    console.log('openAccountModal called');
    const modal = document.getElementById('accountModal');
    const overlay = document.getElementById('accountModalOverlay');

    if (!modal || !overlay) {
        console.error('openAccountModal: Modal elements not found', { modal, overlay });
        return;
    }

    if (AuthManager.isAuthenticated()) {
        console.log('openAccountModal: User authenticated, showing logged in view');
        showLoggedInView();
    } else {
        console.log('openAccountModal: User not authenticated, showing account choice');
        showAccountChoice();
    }

    modal.classList.add('active');
    overlay.classList.add('active');
    console.log('openAccountModal: Modal opened');
}

export function closeAccountModal() {
    console.log('closeAccountModal called');
    const modal = document.getElementById('accountModal');
    const overlay = document.getElementById('accountModalOverlay');

    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    console.log('closeAccountModal: Modal closed');
}

export function showAccountChoice() {
    console.log('showAccountChoice called');
    document.querySelectorAll('.account-view').forEach(v => v.style.display = 'none');
    const v = document.getElementById('accountChoiceView');
    if (v) {
        v.style.display = 'block';
        console.log('showAccountChoice: Account choice view shown');
    } else {
        console.error('showAccountChoice: accountChoiceView element not found');
    }
}

export function showLoginView() {
    console.log('showLoginView called');
    document.querySelectorAll('.account-view').forEach(v => v.style.display = 'none');
    const v = document.getElementById('loginView');
    if (v) {
        v.style.display = 'block';
        console.log('showLoginView: Login view shown');
    } else {
        console.error('showLoginView: loginView element not found');
    }
}

export function showSignupView() {
    console.log('showSignupView called');
    document.querySelectorAll('.account-view').forEach(v => v.style.display = 'none');
    const v = document.getElementById('signupView');
    if (v) {
        v.style.display = 'block';
        console.log('showSignupView: Signup view shown');
    } else {
        console.error('showSignupView: signupView element not found');
    }
}

export function showLoggedInView() {
    document.querySelectorAll('.account-view').forEach(v => v.style.display = 'none');
    if (state.currentUser) {
        const n = document.getElementById('userName');
        const e = document.getElementById('userEmail');
        if (n) n.textContent = `Welcome, ${state.currentUser.firstName}!`;
        if (e) e.textContent = state.currentUser.email;
    }
    const v = document.getElementById('loggedInView');
    if (v) v.style.display = 'block';
}

export function handleGoogleLogin() { window.location.href = `${API_URL}/auth/google`; }

export async function handleLogin(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    if (!emailInput || !passInput) {
        showNotification('Login form not found', 'error');
        return;
    }
    const email = emailInput.value.trim();
    const pass = passInput.value;
    if (!email || !pass) {
        showNotification('Please enter email and password', 'error');
        return;
    }
    const res = await AuthManager.login(email, pass);
    if (res.success) {
        showNotification(`Welcome back, ${res.user?.firstName || 'User'}!`, 'success');
        showLoggedInView();
        closeAccountModal();
    } else {
        showNotification(res.error || 'Login failed', 'error');
    }
}

export async function handleSignup(e) {
    if (e) e.preventDefault();
    const firstNameInput = document.getElementById('signupFirstName');
    const lastNameInput = document.getElementById('signupLastName');
    const emailInput = document.getElementById('signupEmail');
    const passwordInput = document.getElementById('signupPassword');
    const confirmPasswordInput = document.getElementById('signupConfirmPassword');

    if (!firstNameInput || !lastNameInput || !emailInput || !passwordInput || !confirmPasswordInput) {
        showNotification('Signup form not found', 'error');
        return;
    }

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
        showNotification('Please fill in all fields', 'error');
        return;
    }

    if (password !== confirmPassword) {
        showNotification('Passwords do not match', 'error');
        return;
    }

    if (password.length < 6) {
        showNotification('Password must be at least 6 characters', 'error');
        return;
    }

    const res = await AuthManager.signup({ firstName, lastName, email, password });
    if (res.success) {
        showNotification(`Welcome, ${firstName}!`, 'success');
        showLoggedInView();
        closeAccountModal();
    } else {
        showNotification(res.error, 'error');
    }
}

export function handleLogout() {
    AuthManager.logout();
    window.location.reload();
}

export function openCart() {
    console.log('openCart called');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const overlay = document.getElementById('overlay');

    if (cartSidebar) {
        cartSidebar.classList.add('open', 'active');
        console.log('Cart sidebar opened');
    } else {
        console.warn('openCart: cartSidebar element not found');
    }

    if (cartOverlay) {
        cartOverlay.classList.add('active');
        cartOverlay.style.display = 'block';
    } else if (overlay) {
        overlay.classList.add('active');
        overlay.style.display = 'block';
    } else {
        console.warn('openCart: No overlay element found');
    }
}

export function closeCart() {
    console.log('closeCart called');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const overlay = document.getElementById('overlay');

    if (cartSidebar) {
        cartSidebar.classList.remove('open', 'active');
        console.log('Cart sidebar closed');
    } else {
        console.warn('closeCart: cartSidebar element not found');
    }

    if (cartOverlay) {
        cartOverlay.classList.remove('active');
        cartOverlay.style.display = 'none';
    } else if (overlay) {
        overlay.classList.remove('active');
        overlay.style.display = 'none';
    }
}

export function handleScroll() {
    const n = document.getElementById('navbar');
    if (n) {
        if (window.scrollY > 50) n.classList.add('scrolled');
        else n.classList.remove('scrolled');
    }
}

export function addToCart(productId) {
    if (!productId) {
        console.error('addToCart: productId is required');
        return;
    }
    if (state.products.length === 0) {
        console.warn('addToCart: No products loaded yet');
        showNotification('Products are still loading, please try again', 'info');
        return;
    }
    CartManager.add(productId);
}

export function addToCartFromModal() {
    console.log('addToCartFromModal called');
    console.log('state.selectedProduct:', state.selectedProduct);

    if (!state.selectedProduct) {
        console.error('addToCartFromModal: No product selected');
        showNotification('No product selected', 'error');
        return;
    }
    const productId = state.selectedProduct.id || state.selectedProduct._id;
    console.log('Product ID from modal:', productId);

    if (!productId) {
        console.error('addToCartFromModal: Product has no ID', state.selectedProduct);
        showNotification('Product ID is missing', 'error');
        return;
    }
    CartManager.add(productId);
}

export function updateCart() {
    const ct = document.getElementById('cartCount');
    const ict = document.getElementById('cartItemCount');
    const it = document.getElementById('cartItems');
    const tot = document.getElementById('cartTotal');
    const totalItems = CartManager.getItemCount();
    if (ct) ct.textContent = totalItems;
    if (ict) ict.textContent = totalItems;
    if (!state.cart || state.cart.length === 0) {
        if (it) it.innerHTML = `<div class="cart-empty"><p>${SettingsManager.getTranslation('cartEmpty')}</p></div>`;
        if (tot) tot.textContent = '$0.00';
    } else {
        if (tot) tot.textContent = `$${CartManager.getTotal().toFixed(2)}`;
        if (it) {
            it.innerHTML = state.cart.map((item, index) => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image || 'https://via.placeholder.com/96x96?text=No+Image'}" alt="${escapeHtml(item.name)}" onerror="this.src='https://via.placeholder.com/96x96?text=No+Image'">
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${escapeHtml(item.name)}</div>
                        <div class="cart-item-price">$${item.price}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="window.CartManager.updateQuantity(${index}, -1)" aria-label="Decrease quantity">−</button>
                            <span class="quantity-value">${item.quantity || 1}</span>
                            <button class="quantity-btn" onclick="window.CartManager.updateQuantity(${index}, 1)" aria-label="Increase quantity">+</button>
                        </div>
                    </div>
                    <button class="remove-item-btn" onclick="window.CartManager.remove(${index})" aria-label="Remove ${escapeHtml(item.name)} from cart">×</button>
                </div>
            `).join('');
        }
    }
    if (document.getElementById('checkoutPage')?.classList.contains('active')) updateCheckoutSummary();
}

export function openSearchModal() {
    document.getElementById('searchModal')?.classList.add('active');
    document.getElementById('searchModalOverlay')?.classList.add('active');
    document.getElementById('searchInput')?.focus();
}

export function closeSearchModal() {
    document.getElementById('searchModal')?.classList.remove('active');
    document.getElementById('searchModalOverlay')?.classList.remove('active');
}

export function performSearch() {
    const q = document.getElementById('searchInput')?.value.trim().toLowerCase();
    const res = document.getElementById('searchResults');
    if (!q || !res) return;
    const items = state.products.filter(p => p.name.toLowerCase().includes(q));
    res.innerHTML = items.length ? items.map(p => `
        <div class="search-result-item" onclick="window.openProductModal('${p.id || p._id}'); window.closeSearchModal();">
            <div class="search-result-image">
                <img src="${p.image}" alt="${escapeHtml(p.name)}">
            </div>
            <div class="search-result-info">
                <h4 class="search-result-name">${escapeHtml(p.name)}</h4>
                <div class="search-result-price">$${p.price}</div>
            </div>
        </div>
    `).join('') : '<div class="no-results">No results found</div>';
}

export function showResetPasswordModal() {
    closeAccountModal();
    document.getElementById('resetPasswordModalOverlay')?.classList.add('active');
    document.getElementById('resetPasswordModal')?.classList.add('active');
}

export function closeResetPasswordModal() {
    document.getElementById('resetPasswordModalOverlay')?.classList.remove('active');
    document.getElementById('resetPasswordModal')?.classList.remove('active');
}

export function renderAddresses() {
    const g = document.getElementById('addressesGrid');
    if (!g) return;
    g.innerHTML = AddressManager.addresses.length ? AddressManager.addresses.map(a => `
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

export function openAddressModal(id = null) {
    console.log('openAddressModal called with id:', id);
    const form = document.getElementById('addressForm');
    const addressIdInput = document.getElementById('addressId');
    const modal = document.getElementById('addressModal');
    const overlay = document.getElementById('addressModalOverlay');
    const title = document.getElementById('addressModalTitle');

    if (!form || !addressIdInput || !modal || !overlay) {
        console.error('Address modal elements not found');
        showNotification('Address form not available', 'error');
        return;
    }

    form.reset();
    addressIdInput.value = id || '';

    if (id && title) {
        title.textContent = 'Edit Address';
        const a = AddressManager.addresses.find(x => x._id === id);
        if (a) {
            const fieldMap = {
                'label': 'addressLabel',
                'phone': 'addressPhone',
                'firstName': 'addressFirstName',
                'lastName': 'addressLastName',
                'street': 'addressStreet',
                'city': 'addressCity',
                'zip': 'addressZip',
                'zipCode': 'addressZip',
                'country': 'addressCountry'
            };

            Object.entries(fieldMap).forEach(([key, inputId]) => {
                const input = document.getElementById(inputId);
                if (input && a[key]) {
                    input.value = a[key];
                }
            });

            const defaultCheckbox = document.getElementById('addressIsDefault');
            if (defaultCheckbox) {
                defaultCheckbox.checked = a.isDefault || false;
            }
        }
    } else if (title) {
        title.textContent = 'Add New Address';
    }

    modal.classList.add('active');
    overlay.classList.add('active');
    console.log('Address modal opened');
}

export function closeAddressModal() {
    document.getElementById('addressModal')?.classList.remove('active');
    document.getElementById('addressModalOverlay')?.classList.remove('active');
}

export async function handleAddressSubmit(e) {
    e.preventDefault();
    console.log('handleAddressSubmit called');
    const id = document.getElementById('addressId')?.value;
    const d = {
        label: document.getElementById('addressLabel')?.value,
        phone: document.getElementById('addressPhone')?.value,
        firstName: document.getElementById('addressFirstName')?.value,
        lastName: document.getElementById('addressLastName')?.value,
        street: document.getElementById('addressStreet')?.value,
        city: document.getElementById('addressCity')?.value,
        zip: document.getElementById('addressZip')?.value,
        zipCode: document.getElementById('addressZip')?.value,
        country: document.getElementById('addressCountry')?.value,
        isDefault: document.getElementById('addressIsDefault')?.checked || false
    };

    console.log('Submitting address:', d);
    const r = id ? await AddressManager.updateAddress(id, d) : await AddressManager.addAddress(d);

    if (r.success) {
        console.log('Address saved successfully');
        showNotification(id ? 'Address updated successfully' : 'Address added successfully', 'success');
        closeAddressModal();
        renderAddresses();
        renderCheckoutAddresses(); // Also update checkout addresses
    } else {
        console.error('Address save failed:', r.error);
        showNotification(r.error || 'Failed to save address', 'error');
    }
}

export function editAddress(id) { openAddressModal(id); }
export async function deleteAddress(id) {
    if (confirm('Delete?')) {
        if ((await AddressManager.deleteAddress(id)).success) renderAddresses();
    }
}

export function showAddressForm() {
    openAddressModal();
}

export function continueAsGuest() {
    closeAccountModal();
    showNotification('Continuing as guest', 'info');
}

export function toggleReviewForm() {
    if (!AuthManager.isAuthenticated()) {
        showNotification('Please login to write a review', 'error');
        openAccountModal();
        return;
    }
    const form = document.getElementById('reviewForm');
    const btn = document.getElementById('writeReviewBtn');
    if (form) {
        const isHidden = form.style.display === 'none' || !form.style.display;
        form.style.display = isHidden ? 'block' : 'none';
        if (btn) {
            btn.textContent = isHidden ? 'Cancel' : 'Write a Review';
        }
    }
}

export async function confirmDeleteAccount() {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        return;
    }
    try {
        const response = await fetch(`${API_URL}/auth/delete-account`, {
            method: 'DELETE',
            headers: AuthManager.getAuthHeader()
        });
        if (response.ok) {
            handleLogout();
            showNotification('Account deleted successfully', 'success');
            window.showHomePage();
        } else {
            showNotification('Failed to delete account', 'error');
        }
    } catch (error) {
        console.error('Error deleting account:', error);
        showNotification('Failed to delete account', 'error');
    }
}

export async function placeOrder() {
    // This function is for the legacy checkout form
    // The new checkout uses Stripe's handlePaymentSubmission
    const form = document.getElementById('checkoutForm');
    if (!form) {
        showNotification('Please use the new checkout page', 'info');
        return;
    }

    // Basic validation
    const email = document.getElementById('email')?.value.trim();
    const firstName = document.getElementById('firstName')?.value.trim();
    const lastName = document.getElementById('lastName')?.value.trim();
    const address = document.getElementById('address')?.value.trim();
    const city = document.getElementById('city')?.value.trim();
    const zip = document.getElementById('zip')?.value.trim();
    const country = document.getElementById('country')?.value;

    if (!email || !firstName || !lastName || !address || !city || !zip || !country) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (state.cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }

    // Redirect to new checkout or process order
    showNotification('Redirecting to secure checkout...', 'info');
    goToCheckout();
}

// CHECKOUT & PAYMENT
export function goToCheckout() {
    console.log('goToCheckout called');
    console.log('Cart length:', state.cart.length);
    console.log('Is authenticated:', AuthManager.isAuthenticated());
    console.log('Cart items:', state.cart);

    if (!state.cart || state.cart.length === 0) {
        console.warn('goToCheckout: Cart is empty');
        showNotification('Cart is empty', 'error');
        return;
    }

    console.log('goToCheckout: Closing cart sidebar');
    closeCart();

    if (!AuthManager.isAuthenticated()) {
        console.log('goToCheckout: User not authenticated, opening login modal');
        showLoginView();
        openAccountModal();
        showNotification('Please sign in to checkout', 'info');
        return;
    }

    console.log('goToCheckout: User authenticated, showing checkout page');
    if (window.showCheckoutPage) {
        try {
            window.showCheckoutPage();
            console.log('goToCheckout: Checkout page shown, initializing payment');
            initializePayment();
            checkSavedAddresses();
        } catch (error) {
            console.error('goToCheckout: Error showing checkout page:', error);
            showNotification('Failed to open checkout', 'error');
        }
    } else {
        console.error('goToCheckout: showCheckoutPage not found on window');
        showNotification('Checkout page not available', 'error');
    }
}

// Make togglePaymentMethod globally available
window.togglePaymentMethod = function (method) {
    const cardContainer = document.getElementById('card-payment-container');
    const cashContainer = document.getElementById('cash-payment-info');

    if (method === 'cash') {
        cardContainer.classList.add('hidden');
        cashContainer.classList.remove('hidden');
    } else {
        cardContainer.classList.remove('hidden');
        cashContainer.classList.add('hidden');
    }
};

// Initialize payment handlers
export async function initializePayment() {
    const paymentElement = document.getElementById('payment-element');
    if (!paymentElement) {
        console.warn('Payment element not found');
        return;
    }

    // Show loading state
    paymentElement.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary);">Loading payment form...</div>';

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

    // Unmount existing payment element if it exists
    if (state.paymentElement) {
        try {
            state.paymentElement.unmount();
        } catch (e) {
            // Ignore unmount errors
        }
    }

    try {
        const formData = {
            amount: Math.round(total * 100),
            currency: 'usd'
        };

        const res = await fetch(`${API_URL}/payments/create-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...AuthManager.getAuthHeader() },
            body: JSON.stringify(formData)
        });

        if (!res.ok) {
            throw new Error(`Payment initialization failed: ${res.status} `);
        }

        const data = await res.json();
        if (!data.clientSecret) {
            throw new Error('No client secret received');
        }

        if (!state.stripe) {
            // Try to load Stripe - you should set your Stripe publishable key
            const stripeKey = 'pk_test_51Q...'; // Replace with your actual Stripe key
            if (typeof Stripe !== 'undefined') {
                state.stripe = Stripe(stripeKey);
            } else {
                throw new Error('Stripe library not loaded');
            }
        }

        state.elements = state.stripe.elements({
            appearance: { theme: 'stripe' },
            clientSecret: data.clientSecret
        });
        state.paymentElement = state.elements.create('payment', { layout: 'tabs' });
        state.paymentElement.mount('#payment-element');

    } catch (e) {
        console.error('Payment initialization error:', e);
        const errorMessage = e.message || 'Connection failed';
        const isConnectionError = errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_CONNECTION_REFUSED');

        paymentElement.innerHTML = `
        <div class="mock-card-form">
                <div class="mock-form-header">
                    <h3>Enter Payment Details</h3>
                    <p>Stripe is unavailable. Using secure mock processing.</p>
                </div>
                
                <div class="mock-form-group">
                    <label>Card Number</label>
                    <div class="mock-input-wrapper">
                        <input type="text" id="mockCardNumber" placeholder="0000 0000 0000 0000" maxlength="19" 
                            class="mock-input"
                            oninput="this.value = this.value.replace(/[^0-9]/g, '').replace(/(.{4})/g, '$1 ').trim()">
                        <svg class="mock-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="2" stroke-width="2"/><path d="M2 10h20" stroke-width="2"/></svg>
                    </div>
                </div>
                
                <div class="mock-form-row">
                    <div class="mock-form-group" style="flex: 1;">
                        <label>Expiry</label>
                        <div class="mock-input-wrapper">
                            <input type="text" id="mockCardExpiry" placeholder="MM/YY" maxlength="5"
                                class="mock-input"
                                oninput="this.value = this.value.replace(/\D/g, '').replace(/^(\d{2})(\d)/, '$1/$2').slice(0, 5)">
                        </div>
                    </div>
                    <div class="mock-form-group" style="flex: 1;">
                        <label>CVC</label>
                        <div class="mock-input-wrapper">
                            <input type="text" id="mockCardCvc" placeholder="123" maxlength="3"
                                class="mock-input"
                                oninput="this.value = this.value.replace(/[^0-9]/g, '')">
                            <svg class="mock-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke-width="2"/><path d="M7 11V7a5 5 0 0110 0v4" stroke-width="2"/></svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
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
    const s = document.getElementById('checkoutSubtotal'); if (s) s.textContent = `$${subtotal.toFixed(2)} `;
    const sh = document.getElementById('checkoutShipping'); if (sh) sh.textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)} `;
    const discountRow = document.getElementById('checkoutDiscountRow');
    const discountEl = document.getElementById('checkoutDiscount');
    if (discount > 0) {
        if (discountRow) discountRow.classList.remove('hidden');
        if (discountEl) discountEl.textContent = `- $${discount.toFixed(2)} `;
    } else {
        if (discountRow) discountRow.classList.add('hidden');
    }
    const t = document.getElementById('checkoutTotal'); if (t) t.textContent = `$${total.toFixed(2)} `;
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

export function renderCheckoutAddresses() {
    // Legacy function kept to avoid breaking imports, but address selection is removed
}



export function selectAddress(el, id) {
    // Legacy function
}

export async function applyCoupon() {
    const code = document.getElementById('couponCode')?.value.trim();
    const messageEl = document.getElementById('couponMessage');
    if (!code || !messageEl) return;

    const subtotal = CartManager.getTotal();
    try {
        const response = await fetch(`${API_URL}/coupons/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...AuthManager.getAuthHeader() },
            body: JSON.stringify({ code, cartTotal: subtotal })
        });
        const data = await response.json();
        if (data.valid) {
            state.currentCoupon = data.coupon;
            messageEl.textContent = `Coupon applied: -${data.coupon.discountType === 'percentage' ? data.coupon.discountValue + '%' : '$' + data.coupon.discountValue} `;
            messageEl.className = 'coupon-message success';
            updateCheckoutSummary();
            if (state.stripe) initializePayment();
        } else {
            state.currentCoupon = null;
            messageEl.textContent = data.message || 'Invalid coupon code';
            messageEl.className = 'coupon-message error';
            updateCheckoutSummary();
        }
    } catch (error) {
        console.error('Coupon error:', error);
        messageEl.textContent = 'Failed to validate coupon';
        messageEl.className = 'coupon-message error';
        state.currentCoupon = null;
        updateCheckoutSummary();
    }
}

export async function handlePaymentSubmission() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';

    // Check if we are using Stripe or Mock form
    const isMockPayment = paymentMethod === 'card' && (!state.stripe || !state.elements);

    // Only block if it's a real Stripe attempt and Stripe is missing
    if (paymentMethod === 'card' && !isMockPayment && (!state.stripe || !state.elements)) {
        showNotification('Please complete all required fields', 'error');
        return;
    }

    const btn = document.getElementById('submitPaymentBtn');
    if (!btn) {
        console.error('Submit payment button not found');
        return;
    }

    btn.disabled = true;
    const btnText = document.getElementById('button-text');
    const spinner = document.getElementById('spinner');

    if (btnText) btnText.textContent = 'Processing...';
    if (spinner) spinner.classList.remove('hidden');

    try {
        // Validate form fields directly
        const requiredFields = ['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'zip', 'country'];
        const missingFields = requiredFields.filter(id => !document.getElementById(id)?.value?.trim());

        if (missingFields.length > 0) {
            throw new Error(`Please fill in all required fields: ${missingFields.join(', ')} `);
        }

        if (isMockPayment) {
            // Validate Mock Fields
            const num = document.getElementById('mockCardNumber')?.value;
            const exp = document.getElementById('mockCardExpiry')?.value;
            const cvc = document.getElementById('mockCardCvc')?.value;

            if (!num || num.length < 16 || !exp || !cvc) {
                throw new Error('Please enter valid card details');
            }

            // Simulate processing
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Fall through to success handling (same as cash/stripe success)

            const finalTotal = CartManager.getTotal();
            CartManager.clear();
            window.location.href = '#orderSuccessPage';
            showPage('orderSuccessPage');

            // Populate success page
            const email = document.getElementById('email')?.value || 'customer@example.com';

            const emailEl = document.getElementById('successEmail');
            if (emailEl) emailEl.textContent = email;

            const orderNumEl = document.getElementById('successOrderNumber');
            if (orderNumEl) orderNumEl.textContent = '#' + Math.floor(Math.random() * 1000000);

            const dateEl = document.getElementById('successDate');
            if (dateEl) dateEl.textContent = new Date().toLocaleDateString();

            const totalEl = document.getElementById('successTotal');
            if (totalEl) totalEl.textContent = '$' + finalTotal.toFixed(2);

            return; // Exit after mock success
        }

        if (paymentMethod === 'cash') {
            // Cash on Delivery Logic
            const orderData = {
                items: CartManager.items,
                total: CartManager.getTotal(),
                customer: {
                    email: document.getElementById('email')?.value,
                    phone: document.getElementById('phone')?.value,
                    name: `${document.getElementById('firstName')?.value} ${document.getElementById('lastName')?.value} `.trim()
                },
                shippingAddress: {
                    line1: document.getElementById('address')?.value,
                    city: document.getElementById('city')?.value,
                    state: document.getElementById('state')?.value,
                    postal_code: document.getElementById('zip')?.value,
                    country: document.getElementById('country')?.value
                },
                paymentMethod: 'cod',
                status: 'pending'
            };

            // Simulate backend call for Cash Order
            // In a real app, you would POST this to /orders
            console.log('Processing Cash Order:', orderData);

            // Mock success delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            CartManager.clear();
            window.location.href = '#orderSuccessPage';
            showPage('orderSuccessPage');

            document.getElementById('successEmail').textContent = orderData.customer.email;
            document.getElementById('successOrderNumber').textContent = '#' + Math.floor(Math.random() * 1000000);
            document.getElementById('successDate').textContent = new Date().toLocaleDateString();
            document.getElementById('successTotal').textContent = '$' + orderData.total.toFixed(2);

        } else {
            // Stripe Card Logic
            const { error } = await state.stripe.confirmPayment({
                elements: state.elements,
                confirmParams: {
                    return_url: window.location.origin + window.location.pathname,
                    receipt_email: document.getElementById('email')?.value || state.currentUser?.email || '',
                    shipping: {
                        name: `${document.getElementById('firstName')?.value || ''} ${document.getElementById('lastName')?.value || ''} `.trim(),
                        phone: document.getElementById('phone')?.value || '',
                        address: {
                            line1: document.getElementById('address')?.value || '',
                            city: document.getElementById('city')?.value || '',
                            state: document.getElementById('state')?.value || '',
                            postal_code: document.getElementById('zip')?.value || '',
                            country: document.getElementById('country')?.value || 'US'
                        }
                    }
                }
            });

            if (error) {
                if (error.type === "card_error" || error.type === "validation_error") {
                    showMessage(error.message);
                } else {
                    showMessage("An unexpected error occurred.");
                }
            }
        }
        btn.disabled = false;
        if (btnText) btnText.textContent = 'Pay Now';
        if (spinner) spinner.classList.add('hidden');
    } catch (error) {
        console.error('Payment submission error:', error);
        showNotification(error.message || 'Payment failed. Please try again.', 'error');
        btn.disabled = false;
        if (btnText) btnText.textContent = 'Pay Now';
        if (spinner) spinner.classList.add('hidden');
    }
}



// ============================================================================
// ADDRESS SELECTION FOR CHECKOUT
// ============================================================================

export function checkSavedAddresses() {
    const addresses = AddressManager.getAddresses();
    const btn = document.getElementById('useSavedAddressBtn');

    if (btn) {
        if (addresses && addresses.length > 0) {
            btn.style.display = 'block';
        } else {
            btn.style.display = 'none';
        }
    }
}

export function openAddressSelectionModal() {
    const addresses = AddressManager.getAddresses();

    // Create modal if it doesn't exist
    let modal = document.getElementById('addressSelectionModal');
    let overlay = document.getElementById('addressSelectionModalOverlay');

    if (!modal) {
        overlay = document.createElement('div');
        overlay.id = 'addressSelectionModalOverlay';
        overlay.className = 'account-modal-overlay'; // Corrected class name
        overlay.style.zIndex = '2001'; // Explicit Z-index

        modal = document.createElement('div');
        modal.id = 'addressSelectionModal';
        modal.className = 'account-modal'; // Reusing existing class
        modal.style.zIndex = '2002'; // Ensure on top of overlay

        document.body.appendChild(overlay);
        document.body.appendChild(modal);

        // Close handlers
        overlay.addEventListener('click', closeAddressSelectionModal);
    }

    // Populate modal content
    if (addresses.length === 0) {
        showNotification('No saved addresses found', 'info');
        return;
    }

    const addressesHtml = addresses.map((addr, index) => `
        <div class="address-card" onclick="fillCheckoutForm(${index})" style="cursor: pointer; margin-bottom: 12px; height: auto;">
            <div class="address-card-header" style="margin-bottom: 8px;">
                <div class="address-type-badge">
                    <span class="badge ${addr.type === 'Home' ? 'badge-primary' : 'badge-secondary'}" style="background-color: var(--accent-color); color: white;">
                        ${addr.type}
                    </span>
                    ${addr.isDefault ? '<span class="badge" style="background: #eab308; color: black; margin-left: 8px;">Default</span>' : ''}
                </div>
            </div>
            <div class="address-card-body">
                <span class="address-name">${escapeHtml(addr.firstName)} ${escapeHtml(addr.lastName)}</span>
                <div class="address-line">${escapeHtml(addr.address)}</div>
                <div class="address-line">${escapeHtml(addr.city)}, ${escapeHtml(addr.state)} ${escapeHtml(addr.zip)}</div>
                <div class="address-line">${escapeHtml(addr.country)}</div>
                ${addr.phone ? `<div class="address-line" style="margin-top: 4px; font-size: 13px;">${escapeHtml(addr.phone)}</div>` : ''}
            </div>
        </div>
    `).join('');

    modal.innerHTML = `
        <div class="account-modal-content">
            <button class="modal-close" style="position: absolute; top: 16px; right: 16px;" onclick="closeAddressSelectionModal()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"></path>
                </svg>
            </button>
            <h2 style="margin-bottom: 24px;">Select Shipping Address</h2>
            <div class="addresses-list">
                ${addressesHtml}
            </div>
        </div>
    `;

    modal.classList.add('active');
    overlay.classList.add('active');
}

export function closeAddressSelectionModal() {
    const modal = document.getElementById('addressSelectionModal');
    const overlay = document.getElementById('addressSelectionModalOverlay');
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
}

export function fillCheckoutForm(index) {
    const addresses = AddressManager.getAddresses();
    const addr = addresses[index];

    if (!addr) return;

    // Normalizing country codes (Saved as 3-letter, Checkout wants 2-letter)
    const countryMap = {
        'USA': 'US',
        'FRA': 'FR',
        'MAR': 'MA',
        'UK': 'UK',
        'GBR': 'UK',
        'DE': 'DE', 'DEU': 'DE',
        'ES': 'ES', 'ESP': 'ES',
        'IT': 'IT', 'ITA': 'IT',
        'AU': 'AU', 'AUS': 'AU',
        'CA': 'CA', 'CAN': 'CA'
    };

    let countryCode = addr.country;
    if (countryMap[countryCode]) {
        countryCode = countryMap[countryCode];
    }

    // Fill form fields
    const fields = {
        'firstName': addr.firstName,
        'lastName': addr.lastName,
        'phone': addr.phone,
        'address': addr.street || addr.address,
        'city': addr.city,
        'zip': addr.zip || addr.zipCode,
        'country': countryCode,
        'email': state.currentUser?.email || '' // Auto-fill email
    };

    for (const [id, value] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el && value) {
            el.value = value;
            el.dispatchEvent(new Event('change'));
        }
    }

    // Scroll to form
    const form = document.querySelector('.checkout-section');
    if (form) form.scrollIntoView({ behavior: 'smooth' });

    showNotification('Address applied successfully', 'success');
    closeAddressSelectionModal();
}

// Expose functions globally
window.openAddressSelectionModal = openAddressSelectionModal;
window.closeAddressSelectionModal = closeAddressSelectionModal;
window.fillCheckoutForm = fillCheckoutForm;
