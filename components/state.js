// Add API_URL configuration
export const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api'; // Adjust for production

export const state = {
    products: [],
    cart: JSON.parse(localStorage.getItem('cart')) || [],
    wishlist: [], // Initialize wishlist array
    orders: [], // Initialize orders array
    currentUser: null,
    currentLanguage: localStorage.getItem('language') || 'en',
    currentTheme: localStorage.getItem('theme') || 'light',
    selectedProduct: null,
    token: null, // Initialize token
    stripe: null,
    elements: null,
    paymentElement: null,
    currentCoupon: null,
    selectedAddressId: null
};