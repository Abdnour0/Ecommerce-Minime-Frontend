import { AuthManager } from './auth.js';
import { logger } from './logger.js';
import { API_CONFIG, apiFetch } from './api-config.js';

export const AddressManager = {
    addresses: [],

    async init() {
        try {
            // Load from localStorage as fallback
            const stored = localStorage.getItem('addresses');
            if (stored) {
                this.addresses = JSON.parse(stored);
            }

            // Sync with backend if authenticated
            if (AuthManager.isAuthenticated()) {
                await this.fetchAddresses();
            }
        } catch (e) {
            logger.warn('Error loading addresses:', e);
        }
    },

    async fetchAddresses() {
        try {
            const data = await apiFetch(API_CONFIG.ENDPOINTS.AUTH.ADDRESSES);
            // Map backend fields back to frontend aliases if necessary
            this.addresses = data.map(a => ({
                ...a,
                _id: a.id,
                street: a.street_address,
                zip: a.zip_code
            }));
            localStorage.setItem('addresses', JSON.stringify(this.addresses));
            return true;
        } catch (error) {
            logger.error('Failed to fetch addresses from API:', error);
            return false;
        }
    },

    async addAddress(addressData) {
        if (!AuthManager.isAuthenticated()) {
            return {
                success: false,
                error: 'Please log in to save addresses to your account.'
            };
        }

        try {
            const newAddress = await apiFetch(API_CONFIG.ENDPOINTS.AUTH.ADDRESSES, {
                method: 'POST',
                body: JSON.stringify({
                    label: addressData.label || 'Home',
                    first_name: addressData.firstName,
                    last_name: addressData.lastName,
                    street_address: addressData.street,
                    city: addressData.city,
                    state: addressData.state,
                    zip_code: addressData.zip,
                    country: addressData.country,
                    is_default: addressData.isDefault || false
                })
            });

            await this.fetchAddresses(); // Refresh local list
            return { success: true, address: this.addresses.find(a => a.id === newAddress.id) };
        } catch (error) {
            logger.error('Failed to save address to API:', error);
            return { success: false, error: error.message };
        }
    },

    async updateAddress(id, addressData) {
        if (String(id).startsWith('local_')) return { success: false, error: 'Cannot update local address on server.' };

        try {
            await apiFetch(`${API_CONFIG.ENDPOINTS.AUTH.ADDRESSES}${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    label: addressData.label,
                    first_name: addressData.firstName,
                    last_name: addressData.lastName,
                    street_address: addressData.street,
                    city: addressData.city,
                    state: addressData.state,
                    zip_code: addressData.zip,
                    country: addressData.country,
                    is_default: addressData.isDefault
                })
            });
            await this.fetchAddresses();
            return { success: true };
        } catch (error) {
            logger.error('Failed to update address on API:', error);
            return { success: false, error: error.message };
        }
    },

    async deleteAddress(id) {
        if (String(id).startsWith('local_')) {
            this.addresses = this.addresses.filter(a => a._id !== id);
            localStorage.setItem('addresses', JSON.stringify(this.addresses));
            return { success: true };
        }

        try {
            await apiFetch(`${API_CONFIG.ENDPOINTS.AUTH.ADDRESSES}${id}/`, {
                method: 'DELETE'
            });
            await this.fetchAddresses();
            return { success: true };
        } catch (error) {
            logger.error('Failed to delete address from API:', error);
            return { success: false, error: error.message };
        }
    },

    getAddresses() {
        return this.addresses || [];
    }
};
