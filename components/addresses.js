import { API_URL } from './state.js';
import { AuthManager } from './auth.js';

export const AddressManager = {
    addresses: [],

    async init() {
        // Always load from localStorage first for immediate display
        try {
            const stored = localStorage.getItem('addresses');
            if (stored) {
                this.addresses = JSON.parse(stored);
            }
        } catch (e) {
            console.warn('Error loading addresses from localStorage:', e);
            this.addresses = [];
        }

        // Then try to sync with backend if authenticated
        if (!AuthManager.isAuthenticated()) return;
        try {
            const response = await fetch(`${API_URL}/addresses`, {
                credentials: 'include',
                headers: AuthManager.getAuthHeader()
            });
            if (response.ok) {
                const serverAddresses = await response.json();
                if (Array.isArray(serverAddresses) && serverAddresses.length > 0) {
                    this.addresses = serverAddresses;
                    localStorage.setItem('addresses', JSON.stringify(serverAddresses));
                }
            }
        } catch (e) {
            console.warn('Error fetching addresses from server, using local storage:', e);
            // Already loaded from localStorage above
        }
    },

    async addAddress(addressData) {
        if (!AuthManager.isAuthenticated()) {
            return {
                success: false,
                error: 'Please log in with your account to save addresses. Your addresses will be accessible across all your devices.'
            };
        }

        try {
            const response = await fetch(`${API_URL}/addresses`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...AuthManager.getAuthHeader()
                },
                body: JSON.stringify(addressData)
            });

            if (response.ok) {
                const newAddress = await response.json();
                await this.init(); // Refresh list
                return { success: true, address: newAddress };
            }

            const errorData = await response.json().catch(() => ({}));

            if (response.status === 401) {
                return {
                    success: false,
                    error: 'Your session has expired. Please log in again to save addresses.'
                };
            }

            if (response.status === 400 && errorData.message) {
                return { success: false, error: errorData.message };
            }

            return {
                success: false,
                error: errorData.message || `Unable to save address (Error ${response.status}). Please try again.`
            };
        } catch (e) {
            console.error('Error adding address:', e);
            // Fallback to localStorage when backend is unavailable
            return this.localAddAddress(addressData);
        }
    },

    localAddAddress(addressData) {
        try {
            const addresses = JSON.parse(localStorage.getItem('addresses')) || [];
            const newAddress = {
                _id: 'local_' + Date.now(),
                ...addressData,
                createdAt: new Date().toISOString()
            };
            addresses.push(newAddress);
            localStorage.setItem('addresses', JSON.stringify(addresses));
            this.addresses = addresses;
            console.log('Address saved to local storage');
            return { success: true, address: newAddress };
        } catch (e) {
            console.error('Error saving address locally:', e);
            return { success: false, error: 'Failed to save address locally' };
        }
    },

    async updateAddress(id, addressData) {
        try {
            const response = await fetch(`${API_URL}/addresses/${id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...AuthManager.getAuthHeader()
                },
                body: JSON.stringify(addressData)
            });

            if (response.ok) {
                await this.init();
                return { success: true };
            }
            const errorData = await response.json().catch(() => ({}));
            return { success: false, error: errorData.message || 'Failed to update address' };
        } catch (e) {
            console.error('Error updating address:', e);
            // Fallback to localStorage when backend is unavailable
            return this.localUpdateAddress(id, addressData);
        }
    },

    localUpdateAddress(id, addressData) {
        try {
            const addresses = JSON.parse(localStorage.getItem('addresses')) || [];
            const index = addresses.findIndex(a => a._id === id);
            if (index !== -1) {
                addresses[index] = { ...addresses[index], ...addressData };
                localStorage.setItem('addresses', JSON.stringify(addresses));
                this.addresses = addresses;
                console.log('Address updated in local storage');
                return { success: true };
            }
            return { success: false, error: 'Address not found' };
        } catch (e) {
            console.error('Error updating address locally:', e);
            return { success: false, error: 'Failed to update address locally' };
        }
    },

    async deleteAddress(id) {
        try {
            const response = await fetch(`${API_URL}/addresses/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: AuthManager.getAuthHeader()
            });
            if (response.ok) {
                await this.init();
                return { success: true };
            }
            return { success: false };
        } catch (e) {
            console.error('Error deleting address:', e);
            // Fallback to localStorage when backend is unavailable
            return this.localDeleteAddress(id);
        }
    },

    localDeleteAddress(id) {
        try {
            const addresses = JSON.parse(localStorage.getItem('addresses')) || [];
            const filtered = addresses.filter(a => a._id !== id);
            localStorage.setItem('addresses', JSON.stringify(filtered));
            this.addresses = filtered;
            console.log('Address deleted from local storage');
            return { success: true };
        } catch (e) {
            console.error('Error deleting address locally:', e);
            return { success: false };
        }
    },

    getAddresses() {
        return this.addresses || [];
    }
};
