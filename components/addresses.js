// No API_URL needed
import { AuthManager } from './auth.js';
import { logger } from './logger.js';


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
    },

    async addAddress(addressData) {
        if (!AuthManager.isAuthenticated()) {
            return {
                success: false,
                error: 'Please log in with your account to save addresses. Your addresses will be accessible across all your devices.'
            };
        }

        return this.localAddAddress(addressData);
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
            logger.log('Address saved to local storage');
            return { success: true, address: newAddress };
        } catch (e) {
            console.error('Error saving address locally:', e);
            return { success: false, error: 'Failed to save address locally' };
        }
    },

    async updateAddress(id, addressData) {
        return this.localUpdateAddress(id, addressData);
    },

    localUpdateAddress(id, addressData) {
        try {
            const addresses = JSON.parse(localStorage.getItem('addresses')) || [];
            const index = addresses.findIndex(a => a._id === id);
            if (index !== -1) {
                addresses[index] = { ...addresses[index], ...addressData };
                localStorage.setItem('addresses', JSON.stringify(addresses));
                this.addresses = addresses;
                logger.log('Address updated in local storage');
                return { success: true };
            }
            return { success: false, error: 'Address not found' };
        } catch (e) {
            console.error('Error updating address locally:', e);
            return { success: false, error: 'Failed to update address locally' };
        }
    },

    async deleteAddress(id) {
        return this.localDeleteAddress(id);
    },

    localDeleteAddress(id) {
        try {
            const addresses = JSON.parse(localStorage.getItem('addresses')) || [];
            const filtered = addresses.filter(a => a._id !== id);
            localStorage.setItem('addresses', JSON.stringify(filtered));
            this.addresses = filtered;
            logger.log('Address deleted from local storage');
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
