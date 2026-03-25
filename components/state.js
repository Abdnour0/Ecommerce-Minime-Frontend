// API_URL removed


export const state = {
    products: [],
    cart: [],
    wishlist: [], // Initialize wishlist array
    orders: [], // Initialize orders array
    currentUser: null,
    currentLanguage: localStorage.getItem('language') || 'en',
    currentTheme: localStorage.getItem('theme') || 'light',
    selectedProduct: null,
    recommendations: [],

    token: null, // Initialize token
    stripe: null,
    elements: null,
    paymentElement: null,
    currentCoupon: null,
    selectedAddressId: null
};