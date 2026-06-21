/**
 * API Configuration for the MINIME E-commerce Backend
 */

export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
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

let refreshPromise = null;

const clearSession = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null } }));
};

const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;

    if (!refreshPromise) {
        refreshPromise = fetch(getUrl(API_CONFIG.ENDPOINTS.AUTH.REFRESH), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh: refreshToken }),
        })
            .then(async (response) => {
                if (!response.ok) {
                    clearSession();
                    return null;
                }

                const data = await response.json();
                if (data.access) localStorage.setItem('token', data.access);
                if (data.refresh) localStorage.setItem('refreshToken', data.refresh);
                return data.access || null;
            })
            .finally(() => {
                refreshPromise = null;
            });
    }

    return refreshPromise;
};

/**
 * Standard fetch wrapper with Auth token inclusion
 */
export const apiFetch = async (endpoint, options = {}, retryOnUnauthorized = true) => {
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

    if (
        response.status === 401 &&
        retryOnUnauthorized &&
        endpoint !== API_CONFIG.ENDPOINTS.AUTH.REFRESH
    ) {
        const newToken = await refreshAccessToken();
        if (newToken) return apiFetch(endpoint, options, false);
    }
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || `API Error: ${response.status}`);
    }
    
    // Return empty object for 204 No Content
    if (response.status === 204) return {};
    
    return await response.json();
};
