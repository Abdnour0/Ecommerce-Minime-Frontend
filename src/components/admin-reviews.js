import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const AdminReviewsManager = {
    currentPage: 1,
    statusFilter: '',
    searchQuery: '',

    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminReviewsPanel');
        if (existing) existing.remove();

        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminReviewsPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminReviewsPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminReviewsPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('manageReviews') || 'Manage Reviews'}</h2>
                    <p>${getT('manageReviewsDesc') || 'Moderate product reviews'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-secondary btn-sm" onclick="AdminReviewsManager.goBack()">
                        ← ${getT('backToDashboard') || 'Back to Dashboard'}
                    </button>
                </div>
            </div>
            <div class="admin-orders-filters">
                <select id="reviewStatusFilter" onchange="AdminReviewsManager.filterChanged()">
                    <option value="" data-translate="allStatuses">All Statuses</option>
                    <option value="pending" data-translate="pending">Pending</option>
                    <option value="approved" data-translate="approved">Approved</option>
                </select>
                <input type="text" id="reviewSearch" placeholder="${getT('searchReviews') || 'Search reviews...'}"
                    onkeydown="if(event.key==='Enter') AdminReviewsManager.searchChanged()">
                <button class="btn btn-primary btn-sm" onclick="AdminReviewsManager.searchChanged()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    ${getT('search') || 'Search'}
                </button>
            </div>
            <div class="admin-orders-table-wrap">
                <table class="admin-orders-table">
                    <thead>
                        <tr>
                            <th>${getT('product') || 'Product'}</th>
                            <th>${getT('user') || 'User'}</th>
                            <th>${getT('rating') || 'Rating'}</th>
                            <th>${getT('comment') || 'Comment'}</th>
                            <th>${getT('status') || 'Status'}</th>
                            <th>${getT('date') || 'Date'}</th>
                            <th>${getT('actions') || 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody id="adminReviewsBody">
                        <tr><td colspan="7" class="loading-cell">${getT('loading') || 'Loading...'}</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="adminReviewsPagination" class="admin-orders-pagination"></div>
        `;

        await this.fetchReviews();
    },

    async fetchReviews() {
        const tbody = document.getElementById('adminReviewsBody');
        if (!tbody) return;

        const params = new URLSearchParams({ page: this.currentPage });
        if (this.statusFilter) params.set('status', this.statusFilter);
        if (this.searchQuery) params.set('search', this.searchQuery);

        try {
            const resp = await fetch(`${API_URL}/admin/reviews/?${params}`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();
            this.renderTable(data.reviews);
            this.renderPagination(data);
        } catch (err) {
            logger.error('Failed to fetch reviews:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="error-cell">${translations[state.currentLanguage]?.loadError || 'Failed to load reviews.'}</td></tr>`;
        }
    },

    renderTable(reviews) {
        const tbody = document.getElementById('adminReviewsBody');
        if (!tbody) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        if (reviews.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">${getT('noReviewsFound') || 'No reviews found.'}</td></tr>`;
            return;
        }

        tbody.innerHTML = reviews.map(r => `
            <tr>
                <td><strong>${r.product_name}</strong></td>
                <td>${r.username}</td>
                <td>${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</td>
                <td style="max-width:250px;white-space:normal;word-break:break-word;">${r.comment}</td>
                <td>
                    <span class="status-badge-small" style="background:${r.is_approved ? '#DCFCE7' : '#FEF3C7'};color:${r.is_approved ? '#16A34A' : '#D97706'}">
                        ${r.is_approved ? (getT('approved') || 'Approved') : (getT('pending') || 'Pending')}
                    </span>
                </td>
                <td style="white-space:nowrap;font-size:12px;">${new Date(r.created_at).toLocaleDateString()}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-sm ${r.is_approved ? 'btn-warning' : 'btn-primary'}"
                            onclick="AdminReviewsManager.toggleApproval('${r.id}', ${!r.is_approved})">
                            ${r.is_approved ? (getT('reject') || 'Reject') : (getT('approve') || 'Approve')}
                        </button>
                        <button class="btn btn-secondary btn-sm" style="color:#DC2626;"
                            onclick="AdminReviewsManager.confirmDelete('${r.id}')">${getT('delete') || 'Delete'}</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination(data) {
        const container = document.getElementById('adminReviewsPagination');
        if (!container) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const totalPages = Math.ceil(data.total / data.page_size);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        container.innerHTML = `
            <button ${this.currentPage <= 1 ? 'disabled' : ''} onclick="AdminReviewsManager.goToPage(${this.currentPage - 1})">← ${getT('prev') || 'Prev'}</button>
            <span>${getT('page') || 'Page'} ${this.currentPage} ${getT('of') || 'of'} ${totalPages}</span>
            <button ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="AdminReviewsManager.goToPage(${this.currentPage + 1})">${getT('next') || 'Next'} →</button>
        `;
    },

    filterChanged() {
        this.statusFilter = document.getElementById('reviewStatusFilter').value;
        this.currentPage = 1;
        this.fetchReviews();
    },

    searchChanged() {
        this.searchQuery = document.getElementById('reviewSearch').value;
        this.currentPage = 1;
        this.fetchReviews();
    },

    goToPage(page) {
        this.currentPage = page;
        this.fetchReviews();
    },

    async toggleApproval(reviewId, approved) {
        try {
            const resp = await fetch(`${API_URL}/admin/reviews/${reviewId}/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ is_approved: approved }),
            });
            if (!resp.ok) throw new Error('Update failed');
            showNotification(approved ? 'Review approved.' : 'Review rejected.', 'success');
            await this.fetchReviews();
        } catch (err) {
            logger.error('Failed to update review:', err);
            showNotification('Failed to update review.', 'error');
        }
    },

    async confirmDelete(reviewId) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        if (!confirm(`${getT('confirmDeleteReview') || 'Delete this review?'}`)) return;

        try {
            const resp = await fetch(`${API_URL}/admin/reviews/${reviewId}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!resp.ok) throw new Error('Delete failed');
            showNotification('Review deleted.', 'success');
            await this.fetchReviews();
        } catch (err) {
            logger.error('Failed to delete review:', err);
            showNotification('Failed to delete review.', 'error');
        }
    },

    goBack() {
        this.hide();
    }
};

window.AdminReviewsManager = AdminReviewsManager;
