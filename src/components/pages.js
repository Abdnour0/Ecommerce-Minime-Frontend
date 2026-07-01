import { state } from './state.js';
import { AuthManager } from './auth.js';
import { AddressManager } from './addresses.js';
import { renderProducts, renderRecommendations } from './products.js';
import { renderOrders } from './orders.js';
import { showNotification } from './ui-utils.js';
import { closeAccountModal } from './ui-handlers.js';
import { renderAddresses, updateCheckoutSummary } from './checkout-ui.js';
import { RecentlyViewedManager } from './recently-viewed.js';
import { renderWishlist } from './wishlist.js';

export function closeAllModalsAndOverlays() {
    const overlays = ['.cart-overlay', '.product-modal-overlay', '.search-modal-overlay', '.account-modal-overlay', '.side-menu-overlay', '#overlay', '#addressModalOverlay', '#resetPasswordModalOverlay', '#cartOverlay'];
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

const PAGE_BREADCRUMBS = {
    menPage:            'Men',
    womenPage:          'Women',
    salePage:           'Sale',
    sustainabilityPage: 'Sustainability',
    storesPage:         'Our Stores',
    ourStoryPage:       'Our Story',
    helpCenterPage:     'Help Center',
    returnsPage:        'Returns & Exchanges',
    shippingPage:       'Shipping Info',
    contactPage:        'Contact Us',
    careersPage:        'Careers',
    accessibilityPage:  'Accessibility',
    termsPage:          'Terms of Service',
    privacyPage:        'Privacy Policy',
    profilePage:        'My Profile',
    ordersPage:         'My Orders',
    addressesPage:      'My Addresses',
    settingsPage:       'Settings',
    wishlistPage:       'My Wishlist',
    checkoutPage:       'Checkout',
    dashboardPage:      'Admin Dashboard',
};

function updateBreadcrumbs(pageId) {
    const nav = document.getElementById('breadcrumbNav');
    const currentEl = document.getElementById('breadcrumbCurrent');
    if (!nav || !currentEl) return;

    if (pageId === 'homePage') {
        nav.style.display = 'none';
        return;
    }

    const label = PAGE_BREADCRUMBS[pageId];
    if (label) {
        currentEl.textContent = label;
        nav.style.display = 'block';
    } else {
        nav.style.display = 'none';
    }
}

const PAGE_TITLES = {
    homePage:           'MINIME - Naturally Comfortable Footwear',
    menPage:            'Men\'s Collection | MINIME',
    womenPage:          'Women\'s Collection | MINIME',
    salePage:           'Sale | MINIME',
    sustainabilityPage: 'Sustainability | MINIME',
    storesPage:         'Our Stores | MINIME',
    ourStoryPage:       'Our Story | MINIME',
    helpCenterPage:     'Help Center | MINIME',
    returnsPage:        'Returns & Exchanges | MINIME',
    shippingPage:       'Shipping Info | MINIME',
    contactPage:        'Contact Us | MINIME',
    careersPage:        'Careers | MINIME',
    accessibilityPage:  'Accessibility | MINIME',
    termsPage:          'Terms of Service | MINIME',
    privacyPage:        'Privacy Policy | MINIME',
    profilePage:        'My Profile | MINIME',
    ordersPage:         'My Orders | MINIME',
    addressesPage:      'My Addresses | MINIME',
    settingsPage:       'Settings | MINIME',
    wishlistPage:       'My Wishlist | MINIME',
    checkoutPage:       'Checkout | MINIME',
    dashboardPage:      'Admin Dashboard | MINIME',
};

export function showPage(pageId) {
    closeAllModalsAndOverlays();
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.title = PAGE_TITLES[pageId] || 'MINIME';
    updateBreadcrumbs(pageId);

    // Hide footer on checkout page
    const footer = document.querySelector('.footer');
    if (footer) {
        footer.style.display = pageId === 'checkoutPage' ? 'none' : '';
    }
}

export function showHomePage() {
    showPage('homePage');
    const bestsellersGrid = document.getElementById('homeProductGrid');
    if (bestsellersGrid && state.products.length > 0) {
        renderProducts(bestsellersGrid, 'bestsellers');
    }

    const recentlyViewedSection = document.getElementById('recentlyViewedSection');
    const recentlyViewedGrid = document.getElementById('recentlyViewedGrid');
    if (recentlyViewedSection && recentlyViewedGrid) {
        const viewedIds = RecentlyViewedManager.get();
        if (viewedIds.length > 0 && state.products.length > 0) {
            recentlyViewedSection.classList.remove('hidden');
            renderProducts(recentlyViewedGrid, 'recently-viewed');
        } else {
            recentlyViewedSection.classList.add('hidden');
        }
    }

    const recommendationsGrid = document.getElementById('recommendationsGrid');
    if (recommendationsGrid) {
        renderRecommendations(recommendationsGrid);
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

export function showWishlistPage(event) {
    if (event) event.preventDefault();
    showPage('wishlistPage');
    // Render wishlist when page is shown
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
    updateCheckoutProgress(1);
}

export function updateCheckoutProgress(step) {
    const steps = ['stepCart', 'stepShipping', 'stepPayment', 'stepConfirmation'];
    steps.forEach((id, index) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('active', 'completed');
        if (index + 1 === step) el.classList.add('active');
        else if (index + 1 < step) el.classList.add('completed');
    });
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
