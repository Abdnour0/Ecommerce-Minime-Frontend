import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const AdminWishlistManager = {
    currentPage: 1,
    searchQuery: '',

    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminWishlistPanel');
        if (existing) existing.remove();

        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminWishlistPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminWishlistPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminWishlistPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('wishlist') || 'Wishlist'}</h2>
                    <p>${getT('wishlistAdminDesc') || 'View products saved by users'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-secondary btn-sm" onclick="AdminWishlistManager.goBack()">
                        ← ${getT('backToDashboard') || 'Back to Dashboard'}
                    </button>
                </div>
            </div>
            <div class="admin-orders-filters">
                <input type="text" id="wishlistSearch" placeholder="${getT('searchWishlists') || 'Search by user or product...'}"
                    onkeydown="if(event.key==='Enter') AdminWishlistManager.searchChanged()">
                <button class="btn btn-primary btn-sm" onclick="AdminWishlistManager.searchChanged()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    ${getT('search') || 'Search'}
                </button>
            </div>
            <div class="admin-orders-table-wrap">
                <table class="admin-orders-table">
                    <thead>
                        <tr>
                            <th>${getT('user') || 'User'}</th>
                            <th>${getT('product') || 'Product'}</th>
                            <th>${getT('price') || 'Price'}</th>
                            <th>${getT('addedOn') || 'Added On'}</th>
                        </tr>
                    </thead>
                    <tbody id="adminWishlistBody">
                        <tr><td colspan="4" class="loading-cell">${getT('loading') || 'Loading...'}</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="adminWishlistPagination" class="admin-orders-pagination"></div>
        `;

        await this.fetchItems();
    },

    async fetchItems() {
        const tbody = document.getElementById('adminWishlistBody');
        if (!tbody) return;

        const params = new URLSearchParams({ page: this.currentPage });
        if (this.searchQuery) params.set('search', this.searchQuery);

        try {
            const resp = await fetch(`${API_URL}/admin/wishlists/?${params}`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();
            this.renderTable(data.items);
            this.renderPagination(data);
        } catch (err) {
            logger.error('Failed to fetch wishlist items:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="error-cell">${translations[state.currentLanguage]?.loadError || 'Failed to load wishlist.'}</td></tr>`;
        }
    },

    renderTable(items) {
        const tbody = document.getElementById('adminWishlistBody');
        if (!tbody) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        if (items.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="empty-cell">${getT('noWishlistItems') || 'No wishlist items found.'}</td></tr>`;
            return;
        }

        tbody.innerHTML = items.map(item => `
            <tr>
                <td><strong>${item.user}</strong></td>
                <td>
                    <div style="display:flex;align-items:center;gap:8px;">
                        ${item.product_image ? `<img src="${item.product_image}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">` : ''}
                        <span>${item.product}</span>
                    </div>
                </td>
                <td>$${Number(item.product_price).toFixed(2)}</td>
                <td><small>${new Date(item.created_at).toLocaleDateString()}</small></td>
            </tr>
        `).join('');
    },

    renderPagination(data) {
        const container = document.getElementById('adminWishlistPagination');
        if (!container) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const totalPages = Math.ceil(data.total / data.page_size);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        container.innerHTML = `
            <button ${this.currentPage <= 1 ? 'disabled' : ''} onclick="AdminWishlistManager.goToPage(${this.currentPage - 1})">← ${getT('prev') || 'Prev'}</button>
            <span>${getT('page') || 'Page'} ${this.currentPage} ${getT('of') || 'of'} ${totalPages}</span>
            <button ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="AdminWishlistManager.goToPage(${this.currentPage + 1})">${getT('next') || 'Next'} →</button>
        `;
    },

    searchChanged() {
        this.searchQuery = document.getElementById('wishlistSearch').value;
        this.currentPage = 1;
        this.fetchItems();
    },

    goToPage(page) {
        this.currentPage = page;
        this.fetchItems();
    },

    goBack() {
        this.hide();
    }
};

window.AdminWishlistManager = AdminWishlistManager;
