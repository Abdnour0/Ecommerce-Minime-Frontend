import { logger } from './logger.js';
import { state } from './state.js';
import { AuthManager } from './auth.js';
import { CartManager } from './cart.js';
import { OrderManager, renderOrders, prepareOrderData } from './orders.js';
import { SettingsManager } from './settings.js';
import { AddressManager } from './addresses.js';
import { showNotification, escapeHtml, showConfirmDialog, trapFocus } from './ui-utils.js';
import { showPage } from './pages.js';
import { STRIPE_PUBLISHABLE_KEY } from '../config.js';
import { renderAddresses, updateCheckoutSummary } from './checkout-ui.js';

export function openAccountModal() {
    logger.log('openAccountModal called');
    const modal = document.getElementById('accountModal');
    const overlay = document.getElementById('accountModalOverlay');

    if (!modal || !overlay) {
        logger.error('openAccountModal: Modal elements not found', { modal, overlay });
        return;
    }

    if (AuthManager.isAuthenticated()) {
        logger.log('openAccountModal: User authenticated, showing logged in view');
        showLoggedInView();
    } else {
        logger.log('openAccountModal: User not authenticated, showing account choice');
        showAccountChoice();
    }

    modal.classList.add('active');
    overlay.classList.add('active');
    trapFocus(modal);
    document.body.style.overflow = 'hidden';
    logger.log('openAccountModal: Modal opened');
}

export function closeAccountModal() {
    logger.log('closeAccountModal called');
    const modal = document.getElementById('accountModal');
    const overlay = document.getElementById('accountModalOverlay');

    if (modal)     modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    logger.log('closeAccountModal: Modal closed');
}

export function showAccountChoice() {
    logger.log('showAccountChoice called');
    document.querySelectorAll('.account-view').forEach(v => v.style.display = 'none');
    const viewEl = document.getElementById('accountChoiceView');
    if (viewEl) {
        viewEl.style.display = 'block';
        logger.log('showAccountChoice: Account choice view shown');
    } else {
        logger.error('showAccountChoice: accountChoiceView element not found');
    }
}

export function showLoginView() {
    logger.log('showLoginView called');
    document.querySelectorAll('.account-view').forEach(v => v.style.display = 'none');
    const viewEl = document.getElementById('loginView');
    if (viewEl) {
        viewEl.style.display = 'block';
        logger.log('showLoginView: Login view shown');
    } else {
        logger.error('showLoginView: loginView element not found');
    }
}

export function showSignupView() {
    logger.log('showSignupView called');
    document.querySelectorAll('.account-view').forEach(v => v.style.display = 'none');
    const viewEl = document.getElementById('signupView');
    if (viewEl) {
        viewEl.style.display = 'block';
        logger.log('showSignupView: Signup view shown');
    } else {
        logger.error('showSignupView: signupView element not found');
    }
}

export function showLoggedInView() {
    document.querySelectorAll('.account-view').forEach(v => v.style.display = 'none');
    if (state.currentUser) {
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        if (userNameEl) userNameEl.textContent = `Welcome, ${state.currentUser.firstName}!`;
        if (userEmailEl) userEmailEl.textContent = state.currentUser.email;
    }
    const viewEl = document.getElementById('loggedInView');
    if (viewEl) viewEl.style.display = 'block';
}

export function handleGoogleLogin() {
    AuthManager.loginWithOAuth('google').then((res) => {
        if (!res.success) showNotification(res.error || 'Google login failed', 'error');
    });
}

export function handleFacebookLogin() {
    AuthManager.loginWithOAuth('facebook').then((res) => {
        if (!res.success) showNotification(res.error || 'Facebook login failed', 'error');
    });
}

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

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
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
        if (res.user) {
            showNotification(`Welcome, ${firstName}!`, 'success');
            showLoggedInView();
            closeAccountModal();
        } else {
            showNotification('Account created. Please check your email to confirm, then sign in.', 'success');
            showLoginView();
        }
    } else {
        showNotification(res.error, 'error');
    }
}

export function handleLogout() {
    AuthManager.logout();
    showPage('homePage');
}

export function openCart() {
    logger.log('openCart called');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const overlay = document.getElementById('overlay');

    if (cartSidebar) {
        cartSidebar.classList.add('open', 'active');
        document.body.style.overflow = 'hidden';
        logger.log('Cart sidebar opened');
    } else {
        logger.warn('openCart: cartSidebar element not found');
    }

    if (cartOverlay) {
        cartOverlay.classList.add('active');
        cartOverlay.style.display = 'block';
    } else if (overlay) {
        overlay.classList.add('active');
        overlay.style.display = 'block';
    } else {
        logger.warn('openCart: No overlay element found');
    }
}

export function closeCart() {
    logger.log('closeCart called');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const overlay = document.getElementById('overlay');

    document.body.style.overflow = '';

    if (cartSidebar) {
        cartSidebar.classList.remove('open', 'active');
        logger.log('Cart sidebar closed');
    } else {
        logger.warn('closeCart: cartSidebar element not found');
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
    const navbar = document.getElementById('navbar');
    if (navbar) {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    }
}

export function addToCart(productId) {
    if (!productId) {
        logger.error('addToCart: productId is required');
        return;
    }
    if (state.products.length === 0) {
        logger.warn('addToCart: No products loaded yet');
        showNotification('Products are still loading, please try again', 'info');
        return;
    }
    CartManager.add(productId);
}

export function addToCartFromModal() {
    logger.log('addToCartFromModal called');
    logger.log('state.selectedProduct:', state.selectedProduct);

    if (!state.selectedProduct) {
        logger.error('addToCartFromModal: No product selected');
        showNotification('No product selected', 'error');
        return;
    }
    const productId = state.selectedProduct.id || state.selectedProduct._id;
    logger.log('Product ID from modal:', productId);

    if (!productId) {
        logger.error('addToCartFromModal: Product has no ID', state.selectedProduct);
        showNotification('Product ID is missing', 'error');
        return;
    }
    CartManager.add(productId);
}

export function updateCart() {
    const cartCountEl = document.getElementById('cartCount');
    const cartItemCountEl = document.getElementById('cartItemCount');
    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    const totalItems = CartManager.getItemCount();
    if (cartCountEl) cartCountEl.textContent = totalItems;
    if (cartItemCountEl) cartItemCountEl.textContent = totalItems;
    if (!state.cart || state.cart.length === 0) {
        if (cartItemsEl) cartItemsEl.innerHTML = `<div class="cart-empty"><p>${SettingsManager.getTranslation('cartEmpty')}</p></div>`;
        if (cartTotalEl) cartTotalEl.textContent = '$0.00';
    } else {
        if (cartTotalEl) cartTotalEl.textContent = `$${CartManager.getTotal().toFixed(2)}`;
        if (cartItemsEl) {
            cartItemsEl.innerHTML = state.cart.map((item) => `
                <div class="cart-item">
                    <div class="cart-item-image">
                        <img src="${item.image || 'https://via.placeholder.com/96x96?text=No+Image'}" alt="${escapeHtml(item.name)}" onerror="this.src='https://via.placeholder.com/96x96?text=No+Image'">
                    </div>
                    <div class="cart-item-info">
                        <div class="cart-item-name">${escapeHtml(item.name)}</div>
                        <div class="cart-item-price">$${item.price}</div>
                        <div class="cart-item-quantity">
                            <button class="quantity-btn" onclick="window.CartManager.updateQuantity('${item.id || item._id}', -1)" aria-label="Decrease quantity">−</button>
                            <span class="quantity-value">${item.quantity || 1}</span>
                            <button class="quantity-btn" onclick="window.CartManager.updateQuantity('${item.id || item._id}', 1)" aria-label="Increase quantity">+</button>
                        </div>
                    </div>
                    <button class="remove-item-btn" onclick="window.CartManager.remove('${item.id || item._id}')" aria-label="Remove ${escapeHtml(item.name)} from cart">×</button>
                </div>
            `).join('');
        }
    }
    if (document.getElementById('checkoutPage')?.classList.contains('active')) updateCheckoutSummary();
}

export function openSearchModal() {
    const sm = document.getElementById('searchModal');
    if (sm) {
        sm.classList.add('active');
        trapFocus(sm);
    }
    document.getElementById('searchModalOverlay')?.classList.add('active');
    document.getElementById('searchInput')?.focus();
    document.body.style.overflow = 'hidden';
}

export function closeSearchModal() {
    document.getElementById('searchModal')?.classList.remove('active');
    document.getElementById('searchModalOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
}

export function performSearch() {
    const query = document.getElementById('searchInput')?.value.trim().toLowerCase();
    const resultsEl = document.getElementById('searchResults');
    if (!query || !resultsEl) return;
    const items = state.products.filter(p => p.name.toLowerCase().includes(query));
    resultsEl.innerHTML = items.length ? items.map(p => `
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
    // Close account modal if open
    closeAccountModal();
    
    // Show reset password modal
    const overlay = document.getElementById('resetPasswordModalOverlay');
    const modal = document.getElementById('resetPasswordModal');
    
    if (overlay && modal) {
        overlay.classList.add('active');
        modal.classList.add('active');
        trapFocus(modal);
        document.body.style.overflow = 'hidden';
        
        // Show reset password form directly (skip email step)
        const forgotPasswordView = document.getElementById('forgotPasswordView');
        const resetPasswordFormView = document.getElementById('resetPasswordFormView');
        if (forgotPasswordView) forgotPasswordView.style.display = 'none';
        if (resetPasswordFormView) resetPasswordFormView.style.display = 'block';
        
        // Reset forms
        const forgotForm = document.getElementById('forgotPasswordForm');
        const resetForm = document.getElementById('resetPasswordForm');
        if (forgotForm) forgotForm.reset();
        if (resetForm) resetForm.reset();
    }
}

export function closeResetPasswordModal() {
    const overlay = document.getElementById('resetPasswordModalOverlay');
    const modal = document.getElementById('resetPasswordModal');
    
    if (overlay) overlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
    document.body.style.overflow = '';
}

export function openAddressModal(id = null) {
    logger.log('openAddressModal called with id:', id);
    const form = document.getElementById('addressForm');
    const addressIdInput = document.getElementById('addressId');
    const modal = document.getElementById('addressModal');
    const overlay = document.getElementById('addressModalOverlay');
    const title = document.getElementById('addressModalTitle');

    if (!form || !addressIdInput || !modal || !overlay) {
        logger.error('Address modal elements not found');
        showNotification('Address form not available', 'error');
        return;
    }

    form.reset();
    addressIdInput.value = id || '';

    if (id && title) {
        title.textContent = 'Edit Address';
        const existingAddress = AddressManager.addresses.find(x => x._id === id);
        if (existingAddress) {
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
                if (input && existingAddress[key]) {
                    input.value = existingAddress[key];
                }
            });

            const defaultCheckbox = document.getElementById('addressIsDefault');
            if (defaultCheckbox) {
                defaultCheckbox.checked = existingAddress.isDefault || false;
            }
        }
    } else if (title) {
        title.textContent = 'Add New Address';
    }

    modal.classList.add('active');
    overlay.classList.add('active');
    trapFocus(modal);
    document.body.style.overflow = 'hidden';
    logger.log('Address modal opened');
}

export function closeAddressModal() {
    document.getElementById('addressModal')?.classList.remove('active');
    document.getElementById('addressModalOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
}

export async function handleAddressSubmit(e) {
    e.preventDefault();
    logger.log('handleAddressSubmit called');
    const id = document.getElementById('addressId')?.value;
    const addressData = {
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

    logger.log('Submitting address:', addressData);
    const result = id ? await AddressManager.updateAddress(id, addressData) : await AddressManager.addAddress(addressData);

    if (result.success) {
        logger.log('Address saved successfully');
        showNotification(id ? 'Address updated successfully' : 'Address added successfully', 'success');
        closeAddressModal();
        renderAddresses();
    } else {
        logger.error('Address save failed:', result.error);
        showNotification(result.error || 'Failed to save address', 'error');
    }
}

export function editAddress(id) { openAddressModal(id); }
export async function deleteAddress(id) {
    showConfirmDialog('Are you sure you want to delete this address? This cannot be undone.', async () => {
        if ((await AddressManager.deleteAddress(id)).success) renderAddresses();
    });
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
    showConfirmDialog('Are you sure you want to delete your account? This action cannot be undone.', async () => {
        try {
            await apiFetch('/auth/delete-account/', { method: 'DELETE' });

            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('orders');
            localStorage.removeItem('addresses');
            localStorage.removeItem('wishlist');
            localStorage.removeItem('cart');

            showNotification('Account deleted successfully', 'success');
            setTimeout(() => {
                handleLogout();
            }, 500);
        } catch (error) {
            logger.error('Error deleting account:', error);
            showNotification('Failed to delete account', 'error');
        }
    });
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
    logger.log('goToCheckout called');
    logger.log('Cart length:', state.cart.length);
    logger.log('Is authenticated:', AuthManager.isAuthenticated());
    logger.log('Cart items:', state.cart);

    if (!state.cart || state.cart.length === 0) {
        logger.warn('goToCheckout: Cart is empty');
        showNotification('Cart is empty', 'error');
        return;
    }

    logger.log('goToCheckout: Closing cart sidebar');
    closeCart();

    if (!AuthManager.isAuthenticated()) {
        logger.log('goToCheckout: User not authenticated, opening login modal');
        showLoginView();
        openAccountModal();
        showNotification('Please sign in to checkout', 'info');
        return;
    }

    logger.log('goToCheckout: User authenticated, showing checkout page');
    if (window.showCheckoutPage) {
        try {
            window.showCheckoutPage();
            logger.log('goToCheckout: Checkout page shown, initializing payment');
            initializePayment();
            checkSavedAddresses();
        } catch (error) {
            logger.error('goToCheckout: Error showing checkout page:', error);
            showNotification('Failed to open checkout', 'error');
        }
    } else {
        logger.error('goToCheckout: showCheckoutPage not found on window');
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
}// Initialize payment handlers
export async function initializePayment() {
    const paymentElement = document.getElementById('payment-element');
    if (!paymentElement) {
        logger.warn('Payment element not found');
        return;
    }

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

    // Always render mock card form in standalone mode
    paymentElement.innerHTML = `
        <div class="mock-card-form">
            <div class="mock-form-header">
                <h3>Enter Payment Details</h3>
                <p>Using secure local processing.</p>
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
                            oninput="this.value = this.value.replace(/\\D/g, '').replace(/^(\\d{2})(\\d)/, '$1/$2').slice(0, 5)">
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
export async function applyCoupon() {
    const code = document.getElementById('couponCode')?.value.trim().toUpperCase();
    const messageEl = document.getElementById('couponMessage');
    if (!code || !messageEl) return;

    const validCoupons = {
        'SAVE20': { discountType: 'percentage', discountValue: 20 },
        'MINIME10': { discountType: 'fixed', discountValue: 10 }
    };

    if (validCoupons[code]) {
        state.currentCoupon = validCoupons[code];
        messageEl.textContent = `Coupon applied: -${state.currentCoupon.discountType === 'percentage' ? state.currentCoupon.discountValue + '%' : '$' + state.currentCoupon.discountValue}`;
        messageEl.className = 'coupon-message success';
        updateCheckoutSummary();
    } else {
        state.currentCoupon = null;
        messageEl.textContent = 'Invalid coupon code';
        messageEl.className = 'coupon-message error';
        updateCheckoutSummary();
    }
}

function populateSuccessPage(email, orderId, total) {
    showPage('orderSuccessPage');
    
    const emailEl = document.getElementById('successEmail');
    if (emailEl) emailEl.textContent = email;

    const orderNumEl = document.getElementById('successOrderNumber');
    if (orderNumEl) orderNumEl.textContent = '#' + String(orderId).slice(-8).toUpperCase();

    const dateEl = document.getElementById('successDate');
    if (dateEl) dateEl.textContent = new Date().toLocaleDateString();

    const totalEl = document.getElementById('successTotal');
    if (totalEl) totalEl.textContent = '$' + total.toFixed(2);
}

export async function handlePaymentSubmission() {
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'card';

    // Check if we are using Stripe or Mock form
    const isMockPayment = paymentMethod === 'card' && (!state.stripe || !state.elements);

    const btn = document.getElementById('submitPaymentBtn');
    if (!btn) {
        logger.error('Submit payment button not found');
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

            // Prepare and create order
            const email = document.getElementById('email')?.value || 'customer@example.com';
            const orderData = prepareOrderData('card', email);
            
            try {
                const createdOrder = await OrderManager.createOrder(orderData);
                showNotification('Order placed successfully! Your order has been confirmed.', 'success');
                
                // Clear cart after successful order
                CartManager.clear();

            // Show success page
            populateSuccessPage(email, createdOrder.id, orderData.total);

                // Refresh orders display
                renderOrders();

                return; // Exit after mock success
            } catch (error) {
                logger.error('Error creating order:', error);
                showNotification('Failed to create order. Please try again.', 'error');
                btn.disabled = false;
                if (btnText) btnText.textContent = 'Pay Now';
                if (spinner) spinner.classList.add('hidden');
                return;
            }
        }

        if (paymentMethod === 'cash') {
            // Cash on Delivery Logic
            const email = document.getElementById('email')?.value;
            const orderData = prepareOrderData('cod', email);
            
            try {
                // Create order
                const createdOrder = await OrderManager.createOrder(orderData);
                showNotification('Order placed successfully! Your order has been confirmed.', 'success');

                // Mock success delay
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Clear cart after successful order
                CartManager.clear();

            // Show success page
            populateSuccessPage(email, createdOrder.id, orderData.total);

                // Refresh orders display
                renderOrders();
            } catch (error) {
                logger.error('Error creating order:', error);
                showNotification('Failed to create order. Please try again.', 'error');
                btn.disabled = false;
                if (btnText) btnText.textContent = 'Pay Now';
                if (spinner) spinner.classList.add('hidden');
                return;
            }

        } else {
            // Stripe Card Logic
            // Prepare order data before redirect (to create order after successful payment)
            const email = document.getElementById('email')?.value || state.currentUser?.email || '';
            const orderData = prepareOrderData('card', email);
            
            // Store order data in sessionStorage to create order after redirect
            sessionStorage.setItem('pendingStripeOrder', JSON.stringify(orderData));
            
            const { error } = await state.stripe.confirmPayment({
                elements: state.elements,
                confirmParams: {
                    return_url: window.location.origin + '/',
                    receipt_email: email,
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
                // Clear pending order data if payment fails
                sessionStorage.removeItem('pendingStripeOrder');
                if (error.type === "card_error" || error.type === "validation_error") {
                    showNotification(error.message, 'error');
                } else {
                    showNotification("An unexpected error occurred.", 'error');
                }
            }
            // Note: If payment succeeds, Stripe will redirect, and order will be created in handleURLParameters
        }
        btn.disabled = false;
        if (btnText) btnText.textContent = 'Pay Now';
        if (spinner) spinner.classList.add('hidden');
    } catch (error) {
        logger.error('Payment submission error:', error);
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
                    <span class="badge ${addr.label === 'Home' ? 'badge-primary' : 'badge-secondary'}" style="background-color: var(--accent-color, #F37021); color: white;">
                        ${escapeHtml(addr.label)}
                    </span>
                    ${addr.isDefault ? '<span class="badge" style="background: #eab308; color: black; margin-left: 8px;">Default</span>' : ''}
                </div>
            </div>
            <div class="address-card-body">
                <span class="address-name">${escapeHtml(addr.firstName)} ${escapeHtml(addr.lastName)}</span>
                <div class="address-line">${escapeHtml(addr.street)}</div>
                <div class="address-line">${escapeHtml(addr.city)}, ${escapeHtml(addr.zip)}</div>
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
    trapFocus(modal);
    document.body.style.overflow = 'hidden';
}

export function closeAddressSelectionModal() {
    const modal = document.getElementById('addressSelectionModal');
    const overlay = document.getElementById('addressSelectionModalOverlay');
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
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

// (Global assignments moved to main.js)
