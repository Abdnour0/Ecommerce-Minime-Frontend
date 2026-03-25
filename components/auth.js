import { state } from './state.js';
import { logger } from './logger.js';

export const AuthManager = {
    async init() {
        try {
            const token = localStorage.getItem('token');
            const storedUser = localStorage.getItem('currentUser');
            if (!token || !storedUser) {
                state.currentUser = null;
                state.token = null;
                return;
            }

            state.token = token;
            state.currentUser = JSON.parse(storedUser);
            window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: state.currentUser } }));
            return;
        } catch (e) {
            logger.error('Error loading session:', e);
            this.logout();
        }
    },

    async checkSession() {
        if (state.currentUser) {
            return { success: true, user: state.currentUser };
        }
        return { success: false };
    },

    _getLocalUsers() {
        try {
            return JSON.parse(localStorage.getItem('users')) || [];
        } catch { return []; }
    },

    _saveLocalUsers(users) {
        localStorage.setItem('users', JSON.stringify(users));
    },

    async signup(userData) {
        const users = this._getLocalUsers();

        // Check if email already exists
        if (users.find(u => u.email === userData.email)) {
            return { success: false, error: 'An account with this email already exists' };
        }

        const user = {
            _id: 'local_' + Date.now(),
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            password: userData.password,
            createdAt: new Date().toISOString()
        };

        users.push(user);
        this._saveLocalUsers(users);

        const safeUser = { ...user };
        delete safeUser.password;

        const token = 'local-' + Date.now();
        state.token = token;
        state.currentUser = safeUser;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(safeUser));
        window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: state.currentUser } }));

        return { success: true, user: safeUser };
    },

    async login(email, password) {
        const users = this._getLocalUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (!user) {
            return { success: false, error: 'Invalid email or password' };
        }

        const safeUser = { ...user };
        delete safeUser.password;

        const token = 'local-' + Date.now();
        state.token = token;
        state.currentUser = safeUser;
        localStorage.setItem('token', token);
        localStorage.setItem('currentUser', JSON.stringify(safeUser));
        window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: state.currentUser } }));

        return { success: true, user: safeUser };
    },

    logout() {
        state.currentUser = null;
        state.token = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null } }));
    },

    isAuthenticated() {
        return state.currentUser !== null && state.token !== null;
    },

    async forgotPassword(email) {
        if (!email || !email.trim()) return { success: false, error: 'Email is required' };
        return { success: true, message: 'If an account exists, a password reset link has been simulated.' };
    },

    async resetPassword(email, password) {
        if (!email) return { success: false, error: 'Email is required' };
        if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters' };

        const users = this._getLocalUsers();
        const userIndex = users.findIndex(u => u.email === email);
        if (userIndex !== -1) {
            users[userIndex].password = password;
            this._saveLocalUsers(users);
            return { success: true, message: 'Password reset successfully' };
        }
        return { success: false, error: 'No account found with this email' };
    },

    async updateProfile(profileData) {
        if (!this.isAuthenticated()) return { success: false, error: 'Not logged in' };

        try {
            const updatedUser = { ...state.currentUser, ...profileData };
            state.currentUser = updatedUser;
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));

            const users = this._getLocalUsers();
            const idx = users.findIndex(u => u.email === state.currentUser.email);
            if (idx !== -1) {
                users[idx] = { ...users[idx], ...profileData };
                this._saveLocalUsers(users);
            }

            window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: state.currentUser } }));
            return { success: true };
        } catch (e) {
            return { success: false, error: 'Local update failed' };
        }
    },

    async changePassword(currentPassword, newPassword) {
        if (!this.isAuthenticated()) return { success: false, error: 'Not logged in' };

        const users = this._getLocalUsers();
        const user = users.find(u => u.email === state.currentUser.email);
        if (user && user.password === currentPassword) {
            user.password = newPassword;
            this._saveLocalUsers(users);
            return { success: true, message: 'Password changed successfully' };
        }
        return { success: false, error: 'Current password is incorrect' };
    },
    
    async deleteAccount() {
        if (!this.isAuthenticated()) return { success: false, error: 'Not logged in' };
        
        const users = this._getLocalUsers();
        const filtered = users.filter(u => u.email !== state.currentUser?.email);
        this._saveLocalUsers(filtered);
        this.logout();
        return { success: true };
    },

    getAuthHeader() {
        return {}; // No longer needed
    }
};
