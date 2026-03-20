export const RecentlyViewedManager = {
    STORAGE_KEY: 'minime_recently_viewed',
    MAX_ITEMS: 4,

    /**
     * Get the list of recently viewed product IDs from localStorage
     * @returns {string[]} Array of product IDs
     */
    get() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading recently viewed items:', e);
            return [];
        }
    },

    /**
     * Add a product ID to the recently viewed list
     * @param {string} productId 
     */
    add(productId) {
        if (!productId) return;
        
        let items = this.get();
        // Remove the item if it already exists to move it to the front
        items = items.filter(id => id !== productId);
        // Add to the front
        items.unshift(productId);
        // Cap the list at MAX_ITEMS
        if (items.length > this.MAX_ITEMS) {
            items = items.slice(0, this.MAX_ITEMS);
        }
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
        } catch (e) {
            console.error('Error saving recently viewed item:', e);
        }
    },

    /**
     * Clear the recently viewed list
     */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }
};
