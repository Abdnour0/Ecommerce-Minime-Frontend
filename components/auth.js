import { state, API_URL } from './state.js';

export const AuthManager = {
    async resetPassword(email) {
        return new Promise(resolve => {
            setTimeout(() => { resolve({ success: true }); }, 1000);
        });
    },

    async init() {
        try {
            state.token = localStorage.getItem('token') || null;
            state.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

            if (state.currentUser) {
                window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: state.currentUser } }));
            }
        } catch (e) {
            console.error('Error loading user:', e);
            state.currentUser = null;
            state.token = null;
        }
    },

    async checkSession() {
        // In local/offline mode, we trust what's in local storage
        if (state.currentUser) {
            return { success: true, user: state.currentUser };
        }
        return { success: false };
    },

    async login(email, password) {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                state.currentUser = {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phone: user.phone || ''
                };
                state.token = 'local-dummy-token';
                localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
                localStorage.setItem('token', state.token);

                window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: state.currentUser } }));
                return { success: true, user: state.currentUser };
            }
            return { success: false, error: 'Invalid email or password' };
        } catch (e) {
            console.error('Error during local login:', e);
            return { success: false, error: 'Login failed' };
        }
    },

    async signup(userData) {
        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];

            if (users.find(u => u.email === userData.email)) {
                return { success: false, error: 'Email already registered' };
            }

            users.push(userData);
            localStorage.setItem('users', JSON.stringify(users));

            state.currentUser = {
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone || ''
            };
            state.token = 'local-dummy-token';
            localStorage.setItem('currentUser', JSON.stringify(state.currentUser));
            localStorage.setItem('token', state.token);

            window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: state.currentUser } }));
            return { success: true, user: state.currentUser };
        } catch (e) {
            console.error('Error during local signup:', e);
            return { success: false, error: 'Signup failed' };
        }
    },

    logout() {
        state.currentUser = null;
        state.token = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');

        window.dispatchEvent(new CustomEvent('authChanged', { detail: { user: null } }));
    },

    isAuthenticated() {
        return state.currentUser !== null;
    },

    async forgotPassword(email) {
        try {
            if (!email || !email.trim()) {
                return { success: false, error: 'Email is required' };
            }

            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim() })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return { success: true, message: data.message || `Password reset instructions sent to ${email.trim()}` };
            } else {
                return { success: false, error: data.message || data.error || 'Failed to send reset email' };
            }
        } catch (error) {
            console.error('Error in forgotPassword:', error);
            // Return success even on error to prevent email enumeration, but include the email
            return { success: true, message: `If an account exists with ${email.trim()}, reset instructions have been sent` };
        }
    },

    async resetPassword(email, password) {
        try {
            if (!email || !email.trim()) {
                return { success: false, error: 'Email is required' };
            }
            if (!password || password.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters' };
            }

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === email.trim());

            if (!user) {
                return { success: false, error: 'No account found with this email address' };
            }

            // Update password
            user.password = password;
            localStorage.setItem('users', JSON.stringify(users));

            return { success: true, message: 'Password reset successfully' };
        } catch (e) {
            console.error('Error resetting password:', e);
            return { success: false, error: 'Failed to reset password. Please try again.' };
        }
    },

    async updateProfile(data) {
        if (!state.currentUser) return { success: false, error: 'Not logged in' };

        try {
            state.currentUser = { ...state.currentUser, ...data };
            localStorage.setItem('currentUser', JSON.stringify(state.currentUser));

            const users = JSON.parse(localStorage.getItem('users')) || [];
            const userIndex = users.findIndex(u => u.email === state.currentUser.email);
            if (userIndex !== -1) {
                users[userIndex] = { ...users[userIndex], ...data };
                localStorage.setItem('users', JSON.stringify(users));
            }

            return { success: true };
        } catch (e) {
            console.error('Error updating profile locally:', e);
            return { success: false, error: 'Update failed' };
        }
    },

    async changePassword(currentPassword, newPassword) {
        if (!state.currentUser) return { success: false, error: 'Not logged in' };

        try {
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const user = users.find(u => u.email === state.currentUser.email && u.password === currentPassword);

            if (!user) {
                return { success: false, error: 'Current password is incorrect' };
            }

            user.password = newPassword;
            localStorage.setItem('users', JSON.stringify(users));

            return { success: true };
        } catch (e) {
            console.error('Error changing password locally:', e);
            return { success: false, error: 'Password change failed' };
        }
    },

    getAuthHeader() {
        return {};
    }
};
