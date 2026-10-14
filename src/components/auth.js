import { API_CONFIG, apiFetch, getUrl } from './api-config.js';

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
    },

    async updateProfile(data) {
        try {
            const user = await apiFetch(API_CONFIG.ENDPOINTS.AUTH.ME, {
                method: 'PATCH',
                body: JSON.stringify(data)
            });
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async changePassword(currentPassword, newPassword) {
        try {
            await apiFetch(API_CONFIG.ENDPOINTS.AUTH.PASSWORD_CHANGE, {
                method: 'POST',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async resetPassword(email, password) {
        try {
            await apiFetch(API_CONFIG.ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    async forgotPassword(email) {
        try {
            await apiFetch(API_CONFIG.ENDPOINTS.AUTH.PASSWORD_RESET, {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    startSocialLogin(provider) {
        window.location.href = getUrl(API_CONFIG.ENDPOINTS.AUTH.SOCIAL.replace('{provider}', provider));
    }
};
