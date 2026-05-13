import { API_CONFIG, apiFetch } from './api-config.js';

export const AuthManager = {
    async init() {
        const token = localStorage.getItem('token');
        if (token) {
            const sessionResult = await this.checkSession();
            if (!sessionResult.success) {
                this.logout();
            }
        }
    },

    async checkSession() {
        const token = localStorage.getItem('token');
        if (!token) return { success: false };
        try {
            const user = await apiFetch(API_CONFIG.ENDPOINTS.AUTH.ME);
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        } catch (error) {
            console.error('Session check failed:', error);
            return { success: false, error: error.message };
        }
    },

    async signup(userData) {
        try {
            const response = await apiFetch(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
                method: 'POST',
                body: JSON.stringify({
                    username: userData.email, // Use email as username
                    email: userData.email,
                    password: userData.password,
                    first_name: userData.firstName,
                    last_name: userData.lastName
                })
            });

            if (response.access) {
                localStorage.setItem('token', response.access);
                localStorage.setItem('refreshToken', response.refresh);
                const sessionResult = await this.checkSession();
                return sessionResult;
            }

            return { success: true, user: null };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async login(email, password) {
        try {
            const response = await apiFetch(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
                method: 'POST',
                body: JSON.stringify({ 
                    username: email, // Backend CustomTokenObtainPairView expects username/password by default unless configured otherwise
                    password: password 
                })
            });

            if (response.access) {
                localStorage.setItem('token', response.access);
                localStorage.setItem('refreshToken', response.refresh);
                const sessionResult = await this.checkSession();
                return sessionResult;
            }
            return { success: false, error: 'Invalid response from server' };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: error.message || 'Invalid email or password' };
        }
    },

    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null } }));
    },

    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    getAuthHeader() {
        const token = localStorage.getItem('token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
};
