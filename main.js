import { state } from './components/state.js';
import { AuthManager } from './components/auth.js';
import { CartManager } from './components/cart.js';
import { WishlistManager, renderWishlist } from './components/wishlist.js';
import { SettingsManager } from './components/settings.js';
import { OrderManager, renderOrders } from './components/orders.js';
import { AddressManager } from './components/addresses.js';
import { DashboardManager, showDashboardPage } from './components/dashboard.js';
import { fetchProducts, renderProducts, openProductModal, closeProductModal, changeModalImage } from './components/products.js';
import * as pages from './components/pages.js';
import * as ui from './components/ui-handlers.js';
import { showNotification } from './components/ui-utils.js';
import { ReviewManager, loadAndRenderReviews } from './components/reviews.js';

// ============================================================================
// GLOBAL ERROR HANDLING
// ============================================================================

class AppError extends Error {
    constructor(message, code, context = {}) {
        super(message);
        this.code = code;
        this.context = context;
        this.timestamp = new Date().toISOString();
        this.name = 'AppError';
    }
}

const errorHandler = {
    handle(error, showToUser = true) {
        console.error('[Error Handler]', {
            message: error.message,
            code: error.code,
            context: error.context,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        if (showToUser) {
            const userMessage = this.getUserMessage(error);
            showNotification(userMessage, 'error');
        }
    },

    getUserMessage(error) {
        const messages = {
            'AUTH_FAILED': 'Login failed. Please check your credentials.',
            'NETWORK_ERROR': 'Connection issue. Please try again.',
            'VALIDATION_ERROR': 'Please check your input.',
            'NOT_FOUND': 'Item not found.',
            'PERMISSION_DENIED': 'You don\'t have permission for this action.',
            'STORAGE_ERROR': 'Unable to save data. Please check your browser settings.'
        };
        return messages[error.code] || 'An error occurred. Please try again.';
    }
};

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    errorHandler.handle(new AppError(
        'Unhandled promise rejection',
        'UNHANDLED_REJECTION',
        { reason: event.reason }
    ));
});

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    errorHandler.handle(new AppError(
        'Global error',
        'GLOBAL_ERROR',
        { error: event.error, message: event.message }
    ));
});

// ============================================================================
// EXPOSE MANAGERS & FUNCTIONS TO WINDOW
// ============================================================================

// Managers
window.AuthManager = AuthManager;
window.CartManager = CartManager;
window.WishlistManager = WishlistManager;
window.SettingsManager = SettingsManager;
window.OrderManager = OrderManager;
window.AddressManager = AddressManager;
window.DashboardManager = DashboardManager;
window.ReviewManager = ReviewManager;

// Page navigation functions
window.showHomePage = pages.showHomePage;
window.showMenPage = pages.showMenPage;
window.showWomenPage = pages.showWomenPage;
window.showSalePage = pages.showSalePage;
window.showSustainabilityPage = pages.showSustainabilityPage;
window.showStoresPage = pages.showStoresPage;
window.showOurStoryPage = pages.showOurStoryPage;
window.showHelpCenterPage = pages.showHelpCenterPage;
window.showReturnsPage = pages.showReturnsPage;
window.showShippingPage = pages.showShippingPage;
window.showContactPage = pages.showContactPage;
window.showCareersPage = pages.showCareersPage;
window.showAccessibilityPage = pages.showAccessibilityPage;
window.showProfilePage = pages.showProfilePage;
window.showOrdersPage = pages.showOrdersPage;
window.showAddressesPage = pages.showAddressesPage;
window.showSettingsPage = pages.showSettingsPage;
window.showWishlistPage = pages.showWishlistPage;
window.showCheckoutPage = pages.showCheckoutPage;
window.showDashboardPage = showDashboardPage;
window.showTermsPage = pages.showTermsPage;
window.showPrivacyPage = pages.showPrivacyPage;
window.showPage = pages.showPage;

// Account modal functions
window.openAccountModal = ui.openAccountModal;
window.closeAccountModal = ui.closeAccountModal;
window.showLoginView = ui.showLoginView;
window.showSignupView = ui.showSignupView;
window.showAccountChoice = ui.showAccountChoice;
window.handleLogin = ui.handleLogin;
window.handleSignup = ui.handleSignup;
window.handleLogout = ui.handleLogout;
window.handleGoogleLogin = ui.handleGoogleLogin;

// Cart functions
window.openCart = ui.openCart;
window.closeCart = ui.closeCart;
window.addToCart = ui.addToCart;
window.addToCartFromModal = ui.addToCartFromModal;
window.updateCart = ui.updateCart;

// Product modal functions
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.changeModalImage = changeModalImage;

// Address functions
window.openAddressModal = ui.openAddressModal;
window.closeAddressModal = ui.closeAddressModal;
window.handleAddressSubmit = ui.handleAddressSubmit;
window.editAddress = ui.editAddress;
window.deleteAddress = ui.deleteAddress;
window.renderAddresses = ui.renderAddresses;

// Search functions
window.openSearchModal = ui.openSearchModal;
window.closeSearchModal = ui.closeSearchModal;
window.performSearch = ui.performSearch;



// Checkout functions
window.goToCheckout = ui.goToCheckout;
window.selectAddress = ui.selectAddress;
window.handlePaymentSubmission = ui.handlePaymentSubmission;
window.showAddressForm = ui.showAddressForm;
window.applyCoupon = ui.applyCoupon;
window.continueAsGuest = ui.continueAsGuest;
window.toggleReviewForm = ui.toggleReviewForm;
window.confirmDeleteAccount = ui.confirmDeleteAccount;
window.placeOrder = ui.placeOrder;

// Utility functions
window.showNotification = showNotification;
window.renderOrders = renderOrders;
window.renderWishlist = renderWishlist;
window.loadAndRenderReviews = loadAndRenderReviews;

// State (for debugging)
window.state = state;
window.errorHandler = errorHandler;

// ============================================================================
// INITIALIZATION
// ============================================================================

class AppInitializer {
    constructor() {
        this.isInitialized = false;
        this.initStartTime = null;
    }

    async init() {
        if (this.isInitialized) {
            console.warn('App already initialized');
            return;
        }

        this.initStartTime = performance.now();
        console.log('🚀 Initializing application...');
        console.log('Current hostname:', window.location.hostname);

        try {
            // Initialize managers in order
            await this.initializeManagers();

            // Setup UI
            this.setupUI();

            // Load products
            await this.loadProducts();

            // Setup event listeners
            this.setupEventListeners();

            // Handle URL parameters
            this.handleURLParameters();

            // Setup filter buttons
            this.setupFilterButtons();

            // Setup review form handler
            this.setupReviewForm();

            this.isInitialized = true;
            const initTime = (performance.now() - this.initStartTime).toFixed(2);
            console.log(`✅ Application initialized successfully in ${initTime}ms`);
        } catch (error) {
            console.error('❌ Application initialization failed:', error);
            errorHandler.handle(new AppError(
                'Failed to initialize application',
                'INIT_ERROR',
                { error }
            ), true);
        }
    }

    async initializeManagers() {
        console.log('📦 Initializing managers...');

        const managers = [
            { name: 'Auth', fn: () => AuthManager.init() },
            { name: 'Settings', fn: () => SettingsManager.init() },
            { name: 'Wishlist', fn: () => WishlistManager.init() },
            { name: 'Cart', fn: () => CartManager.init() },
            { name: 'Orders', fn: () => OrderManager.init() },
            { name: 'Addresses', fn: () => AddressManager.init() }
        ];

        for (const manager of managers) {
            try {
                await manager.fn();
                console.log(`  ✓ ${manager.name} initialized`);
            } catch (error) {
                console.error(`  ✗ ${manager.name} failed:`, error);
                throw new AppError(
                    `Failed to initialize ${manager.name}`,
                    'MANAGER_INIT_ERROR',
                    { manager: manager.name, error }
                );
            }
        }
    }

    setupUI() {
        console.log('🎨 Setting up UI...');

        // Update cart display
        ui.updateCart();

        // Ensure home page is active by default
        const allPages = document.querySelectorAll('.page');
        const activePage = document.querySelector('.page.active');
        const homePage = document.getElementById('homePage');

        if (!activePage && homePage) {
            homePage.classList.add('active');
        }


    }

    async loadProducts() {
        console.log('📦 Loading products...');

        try {
            await fetchProducts();

            // Render products on home page if active
            const bestsellersGrid = document.getElementById('homeProductGrid');
            const homePage = document.getElementById('homePage');

            if (homePage && homePage.classList.contains('active') && bestsellersGrid) {
                renderProducts(bestsellersGrid, 'bestsellers');
            }

            // Setup observer for home page activation
            this.setupHomePageObserver(homePage, bestsellersGrid);
        } catch (error) {
            throw new AppError(
                'Failed to load products',
                'PRODUCT_LOAD_ERROR',
                { error }
            );
        }
    }

    setupHomePageObserver(homePage, bestsellersGrid) {
        if (!homePage || !bestsellersGrid) return;

        const observer = new MutationObserver(() => {
            if (homePage.classList.contains('active') &&
                bestsellersGrid &&
                state.products.length > 0) {
                renderProducts(bestsellersGrid, 'bestsellers');
            }
        });

        observer.observe(homePage, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    setupEventListeners() {
        console.log('🔗 Setting up event listeners...');

        // Scroll handler
        window.addEventListener('scroll', ui.handleScroll);

        // Cart update listener
        window.addEventListener('cartUpdated', () => ui.updateCart());

        // Settings dropdown
        this.setupSettingsDropdown();

        // Language and theme selectors
        this.setupLanguageAndTheme();

        // Mobile menu
        this.setupMobileMenu();

        // Modal handlers
        this.setupModalHandlers();

        // Form handlers
        this.setupFormHandlers();

        // Button handlers
        this.setupButtonHandlers();

        // Checkout delegation
        this.setupCheckoutDelegation();

        // Search input
        this.setupSearchInput();


    }

    setupSettingsDropdown() {
        const settingsToggle = document.getElementById('settingsToggle');
        const settingsDropdown = document.getElementById('settingsDropdownMenu');

        if (settingsToggle && settingsDropdown) {
            settingsToggle.onclick = (e) => {
                e.stopPropagation();
                settingsDropdown.classList.toggle('active');
            };

            document.addEventListener('click', (e) => {
                if (!e.target.closest('.settings-dropdown')) {
                    settingsDropdown.classList.remove('active');
                }
            });
        }
    }

    setupLanguageAndTheme() {
        // Language buttons
        document.querySelectorAll('.language-btn').forEach(btn => {
            btn.onclick = () => {
                SettingsManager.setLanguage(btn.dataset.lang);
                // Re-render visible content
                this.refreshVisibleContent();
            };
        });

        // Theme buttons
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.onclick = () => SettingsManager.setTheme(btn.dataset.theme);
        });
    }

    setupMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        const navLinks = document.getElementById('navLinks');

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', () => {
                const isActive = navLinks.classList.toggle('active');
                mobileMenuBtn.setAttribute('aria-expanded', isActive);
            });

            // Close mobile menu when clicking a link
            navLinks.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                });
            });
        }
    }

    setupModalHandlers() {
        // Product modal
        const modalClose = document.getElementById('modalClose');
        const productModalOverlay = document.getElementById('productModalOverlay');

        if (modalClose) {
            modalClose.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                closeProductModal();
            });
        }

        if (productModalOverlay) {
            productModalOverlay.addEventListener('click', (e) => {
                if (e.target === productModalOverlay) {
                    closeProductModal();
                }
            });
        }

        // Account modal
        const accountModalClose = document.getElementById('accountModalClose');
        const accountModalOverlay = document.getElementById('accountModalOverlay');

        if (accountModalClose) {
            accountModalClose.addEventListener('click', () => {
                ui.closeAccountModal();
            });
        }

        if (accountModalOverlay) {
            accountModalOverlay.addEventListener('click', (e) => {
                if (e.target === accountModalOverlay) {
                    ui.closeAccountModal();
                }
            });
        }

        // Search modal
        const searchModalClose = document.getElementById('searchModalClose');
        const searchModalOverlay = document.getElementById('searchModalOverlay');

        if (searchModalClose) {
            searchModalClose.addEventListener('click', ui.closeSearchModal);
        }

        if (searchModalOverlay) {
            searchModalOverlay.addEventListener('click', (e) => {
                if (e.target === searchModalOverlay) {
                    ui.closeSearchModal();
                }
            });
        }

        // Address modal overlay
        const addressModalOverlay = document.getElementById('addressModalOverlay');
        if (addressModalOverlay) {
            addressModalOverlay.addEventListener('click', (e) => {
                if (e.target === addressModalOverlay) {
                    ui.closeAddressModal();
                }
            });
        }

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeProductModal();
                ui.closeAccountModal();
                ui.closeSearchModal();
                ui.closeAddressModal();
                ui.closeCart();
            }
        });
    }

    setupFormHandlers() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', ui.handleLogin);
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', ui.handleSignup);
        }

        // Address form
        const addressForm = document.getElementById('addressForm');
        if (addressForm) {
            addressForm.addEventListener('submit', ui.handleAddressSubmit);
        }

        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const data = {
                    firstName: document.getElementById('profileFirstName')?.value,
                    lastName: document.getElementById('profileLastName')?.value,
                    phone: document.getElementById('profilePhone')?.value
                };

                const result = await AuthManager.updateProfile(data);
                if (result.success) {
                    showNotification('Profile updated successfully', 'success');
                } else {
                    showNotification(result.error || 'Failed to update profile', 'error');
                }
            });
        }

        // Password change form
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const currentPassword = document.getElementById('currentPassword')?.value;
                const newPassword = document.getElementById('newPassword')?.value;
                const confirmPassword = document.getElementById('confirmNewPassword')?.value;

                if (newPassword !== confirmPassword) {
                    showNotification('Passwords do not match', 'error');
                    return;
                }

                const result = await AuthManager.changePassword(currentPassword, newPassword);
                if (result.success) {
                    showNotification('Password updated successfully', 'success');
                    passwordForm.reset();
                } else {
                    showNotification(result.error || 'Failed to update password', 'error');
                }
            });
        }

        // Contact form
        window.handleContactForm = (e) => {
            e.preventDefault();
            showNotification('Thank you! We\'ll get back to you soon.', 'success');
            e.target.reset();
        };

        // Forgot password form
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('forgotEmail')?.value;

                if (email) {
                    const result = await AuthManager.forgotPassword(email);
                    if (result.success) {
                        showNotification('Reset instructions sent to your email', 'success');
                        ui.closeResetPasswordModal();
                    } else {
                        showNotification(result.error || 'Failed to send reset email', 'error');
                    }
                }
            });
        }
    }

    setupButtonHandlers() {
        // Modal add to cart button
        const modalAddToCartBtn = document.getElementById('modalAddToCart');
        if (modalAddToCartBtn) {
            modalAddToCartBtn.addEventListener('click', ui.addToCartFromModal);
        }

        // Google sign-in button
        const googleSigninBtn = document.getElementById('google-signin-btn');
        if (googleSigninBtn) {
            googleSigninBtn.addEventListener('click', ui.handleGoogleLogin);
        }

        // Account button
        const accountBtn = document.getElementById('accountBtn');
        if (accountBtn) {
            accountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ui.openAccountModal();
            });
        }

        // Cart button
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ui.openCart();
            });
        }

        // Search button
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ui.openSearchModal();
            });
        }

        // Cart close button
        const closeCartBtn = document.getElementById('closeCart');
        if (closeCartBtn) {
            closeCartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                ui.closeCart();
            });
        }

        // Cart overlay
        const cartOverlay = document.getElementById('overlay');
        if (cartOverlay) {
            cartOverlay.addEventListener('click', ui.closeCart);
        }
    }

    setupCheckoutDelegation() {
        // Use event delegation for dynamically added checkout buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.checkout-btn')) {
                e.preventDefault();
                e.stopPropagation();
                ui.goToCheckout();
            }
        });
    }

    setupSearchInput() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            // Debounced search
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    ui.performSearch();
                }, 300);
            });

            // Search on Enter
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    ui.performSearch();
                }
            });
        }
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);

        // Handle payment success redirect
        if (urlParams.get('payment_intent')) {
            const status = urlParams.get('redirect_status');

            if (status === 'succeeded') {
                showNotification('Payment successful! Thank you for your order.', 'success');
                CartManager.clear();

                // Clear URL parameters
                window.history.replaceState({}, document.title, window.location.pathname);

                // Show orders page
                setTimeout(() => {
                    pages.showOrdersPage();
                }, 1000);
            } else {
                showNotification('Payment was not completed. Please try again.', 'error');
            }
        }

        // Handle other URL parameters (e.g., OAuth callbacks)
        if (urlParams.get('auth') === 'success') {
            showNotification('Successfully signed in!', 'success');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    setupFilterButtons() {
        // Men's page filters
        const menFilters = document.querySelectorAll('#menPage .filter-btn');
        menFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                menFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                const grid = document.getElementById('menProductGrid');
                if (grid) {
                    renderProducts(grid, `men-${filter}`);
                }
            });
        });

        // Women's page filters
        const womenFilters = document.querySelectorAll('#womenPage .filter-btn');
        womenFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                womenFilters.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filter = btn.dataset.filter;
                const grid = document.getElementById('womenProductGrid');
                if (grid) {
                    renderProducts(grid, `women-${filter}`);
                }
            });
        });
    }

    setupReviewForm() {
        const reviewForm = document.getElementById('reviewForm');
        if (reviewForm) {
            reviewForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                if (!AuthManager.isAuthenticated()) {
                    showNotification('Please login to submit a review', 'error');
                    ui.openAccountModal();
                    return;
                }

                const ratingInputs = reviewForm.querySelectorAll('input[name="rating"]');
                const selectedRating = Array.from(ratingInputs).find(input => input.checked);
                const comment = document.getElementById('reviewComment')?.value;

                if (!selectedRating || !comment) {
                    showNotification('Please provide a rating and comment', 'error');
                    return;
                }

                const productId = state.selectedProduct?.id || state.selectedProduct?._id;
                if (!productId) {
                    showNotification('Product information missing', 'error');
                    return;
                }

                const result = await ReviewManager.addReview(
                    productId,
                    parseInt(selectedRating.value),
                    comment
                );

                if (result.success) {
                    showNotification('Review submitted successfully!', 'success');
                    reviewForm.reset();
                    ui.toggleReviewForm();
                    loadAndRenderReviews(productId);
                } else {
                    showNotification(result.error || 'Failed to submit review', 'error');
                }
            });
        }
    }

    refreshVisibleContent() {
        // Re-render products on visible page
        const activePage = document.querySelector('.page.active');
        if (!activePage) return;

        const pageId = activePage.id;
        const gridMap = {
            'homePage': { grid: 'homeProductGrid', filter: 'bestsellers' },
            'menPage': { grid: 'menProductGrid', filter: 'men-all' },
            'womenPage': { grid: 'womenProductGrid', filter: 'women-all' },
            'salePage': { grid: 'saleProductGrid', filter: 'sale' }
        };

        const pageConfig = gridMap[pageId];
        if (pageConfig) {
            const grid = document.getElementById(pageConfig.grid);
            if (grid && state.products.length > 0) {
                renderProducts(grid, pageConfig.filter);
            }
        }

        // Re-render orders if on orders page
        if (pageId === 'ordersPage') {
            renderOrders();
        }

        // Re-render wishlist if on wishlist page
        if (pageId === 'wishlistPage') {
            renderWishlist();
        }
    }
}

// ============================================================================
// START APPLICATION
// ============================================================================

const app = new AppInitializer();

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await app.init();

        // Log helpful debugging info in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🔧 Debug info:');
            console.log('  Products loaded:', state.products.length);
            console.log('  Cart items:', state.cart.length);
            console.log('  Current user:', state.currentUser?.email || 'Not logged in');
            console.log('  Language:', state.currentLanguage);
            console.log('  Theme:', state.currentTheme);
        }
    } catch (error) {
        console.error('💥 Fatal initialization error:', error);
        showNotification('Failed to start application. Please refresh the page.', 'error');
    }
});

// Log app version (optional)
console.log('%cMINIME E-Commerce', 'font-size: 20px; font-weight: bold; color: #F37021');
console.log('%cVersion 1.0.0', 'font-size: 12px; color: #626567');
console.log('%cNaturally Comfortable', 'font-size: 12px; color: #626567');

// Export for testing
export { app, errorHandler, AppError };