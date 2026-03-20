// API_URL is centralised in config.js — import it from there.
// Kept here as a re-export so existing imports of API_URL from state.js continue to work.
export { API_URL } from '../config.js';


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