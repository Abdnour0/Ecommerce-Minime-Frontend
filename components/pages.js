import { state } from './state.js';
import { AuthManager } from './auth.js';
import { AddressManager } from './addresses.js';
import { renderProducts } from './products.js';
import { renderOrders } from './orders.js';
import { showNotification } from './ui-utils.js';
import { renderAddresses, closeAccountModal, updateCheckoutSummary } from './ui-handlers.js';

export function closeAllModalsAndOverlays() {
    const overlays = ['.cart-overlay', '.product-modal-overlay', '.search-modal-overlay', '.account-modal-overlay', '.side-menu-overlay', '#overlay', '#addressModalOverlay', '#resetPasswordModalOverlay'];
    overlays.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
            el.classList.remove('active');
            if (selector.startsWith('#')) {
                el.style.display = 'none';
                el.style.opacity = '0';
            }
        }
    });

    const modals = ['.product-modal', '.search-modal', '.account-modal', '#sideMenu', '#cartSidebar', '#addressModal', '#resetPasswordModal'];
    modals.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) el.classList.remove('active', 'open');
    });

    document.body.style.overflow = '';
}

export function showPage(pageId) {
    closeAllModalsAndOverlays();
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Hide footer on checkout page
    const footer = document.querySelector('.footer');
    if (footer) {
        if (pageId === 'checkoutPage') {
            footer.style.display = 'none';
        } else {
            footer.style.display = '';
        }
    }
}

export function showHomePage() {
    showPage('homePage');
    // Re-render products when home page is shown
    const bestsellersGrid = document.getElementById('homeProductGrid');
    if (bestsellersGrid && state.products.length > 0) {
        renderProducts(bestsellersGrid, 'bestsellers');
    }
}

export function showMenPage(event) {
    if (event) event.preventDefault();
    showPage('menPage');
    const menGrid = document.getElementById('menProductGrid');
    if (menGrid) renderProducts(menGrid, 'men-all');
}

export function showWomenPage(event) {
    if (event) event.preventDefault();
    showPage('womenPage');
    const womenGrid = document.getElementById('womenProductGrid');
    if (womenGrid) renderProducts(womenGrid, 'women-all');
}

export function showSalePage(event) {
    if (event) event.preventDefault();
    showPage('salePage');
    const saleGrid = document.getElementById('saleProductGrid');
    if (saleGrid) renderProducts(saleGrid, 'sale');
}

export function showSustainabilityPage(event) {
    if (event) event.preventDefault();
    showPage('sustainabilityPage');
}

export function showStoresPage(event) {
    if (event) event.preventDefault();
    showPage('storesPage');
}

export function showProfilePage(event) {
    if (event) event.preventDefault();
    if (!AuthManager.isAuthenticated()) {
        showNotification('Please login first', 'error');
        return;
    }
    closeAccountModal();
    showPage('profilePage');

    if (state.currentUser) {
        const fields = ['firstName', 'lastName', 'email', 'phone'];
        fields.forEach(field => {
            const el = document.getElementById(`profile${field.charAt(0).toUpperCase() + field.slice(1)}`);
            if (el) el.value = state.currentUser[field] || '';
        });
    }
}

export function showOrdersPage(event) {
    if (event) event.preventDefault();
    if (!AuthManager.isAuthenticated()) {
        showNotification('Please login first', 'error');
        return;
    }
    closeAccountModal();
    showPage('ordersPage');
    renderOrders();
}

export async function showAddressesPage(event) {
    if (event) event.preventDefault();
    if (!AuthManager.isAuthenticated()) {
        showNotification('Please login first', 'error');
        return;
    }
    closeAccountModal();
    showPage('addressesPage');
    await AddressManager.init();
    renderAddresses();
}

export function showSettingsPage(event) {
    if (event) event.preventDefault();
    if (!AuthManager.isAuthenticated()) {
        showNotification('Please login first', 'error');
        return;
    }
    closeAccountModal();
    showPage('settingsPage');
}

export async function showWishlistPage(event) {
    if (event) event.preventDefault();
    showPage('wishlistPage');
    // Render wishlist when page is shown
    const { renderWishlist } = await import('./wishlist.js');
    renderWishlist();
}

export function showCheckoutPage(event) {
    if (event) event.preventDefault();
    if (!AuthManager.isAuthenticated()) {
        showNotification('Please login first', 'error');
        return;
    }
    closeAccountModal();
    showPage('checkoutPage');
    updateCheckoutSummary();
}

export function showHelpCenterPage(event) { if (event) event.preventDefault(); showPage('helpCenterPage'); }
export function showReturnsPage(event) { if (event) event.preventDefault(); showPage('returnsPage'); }
export function showShippingPage(event) { if (event) event.preventDefault(); showPage('shippingPage'); }
export function showContactPage(event) { if (event) event.preventDefault(); showPage('contactPage'); }
export function showCareersPage(event) { if (event) event.preventDefault(); showPage('careersPage'); }
export function showAccessibilityPage(event) { if (event) event.preventDefault(); showPage('accessibilityPage'); }
export function showOurStoryPage(event) { if (event) event.preventDefault(); showPage('ourStoryPage'); }
export function showTermsPage(event) { if (event) event.preventDefault(); showPage('termsPage'); }
export function showPrivacyPage(event) { if (event) event.preventDefault(); showPage('privacyPage'); }
