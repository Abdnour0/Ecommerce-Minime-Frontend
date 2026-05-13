/**
 * API Configuration for the MINIME E-commerce Backend
 */

export const API_CONFIG = {
    BASE_URL: 'http://localhost:8000/api',
    ENDPOINTS: {
        PRODUCTS: '/products/',
        AUTH: {
            REGISTER: '/auth/register/',
            LOGIN: '/auth/login/',
            REFRESH: '/auth/login/refresh/',
            ME: '/auth/me/',
            ADDRESSES: '/auth/addresses/',
        },
        ORDERS: '/orders/',
        REVIEWS: '/reviews/',
    }
};

/**
 * Helper to get the absolute URL for an endpoint
 */
export const getUrl = (endpoint) => `${API_CONFIG.BASE_URL}${endpoint}`;

/**
 * Standard fetch wrapper with Auth token inclusion
 */
export const apiFetch = async (endpoint, options = {}) => {
    const url = getUrl(endpoint);
    const token = localStorage.getItem('token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers,
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `API Error: ${response.status}`);
    }
    
    // Return empty object for 204 No Content
    if (response.status === 204) return {};
    
    return await response.json();
};
