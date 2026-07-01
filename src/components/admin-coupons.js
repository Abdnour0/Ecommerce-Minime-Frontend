import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const AdminCouponsManager = {
    currentPage: 1,
    searchQuery: '',
    totalCoupons: 0,

    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminCouponsPanel');
        if (existing) existing.remove();

        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminCouponsPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminCouponsPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminCouponsPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('manageCoupons') || 'Manage Coupons'}</h2>
                    <p>${getT('manageCouponsDesc') || 'Create and manage discount coupons'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-primary btn-sm" onclick="AdminCouponsManager.showAddForm()">
                        + ${getT('addCoupon') || 'Add Coupon'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="AdminCouponsManager.goBack()">
                        ← ${getT('backToDashboard') || 'Back to Dashboard'}
                    </button>
                </div>
            </div>
            <div class="admin-orders-filters">
                <input type="text" id="couponSearch" placeholder="${getT('searchCoupons') || 'Search coupons...'}"
                    onkeydown="if(event.key==='Enter') AdminCouponsManager.searchChanged()">
                <button class="btn btn-primary btn-sm" onclick="AdminCouponsManager.searchChanged()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    ${getT('search') || 'Search'}
                </button>
            </div>
            <div class="admin-orders-table-wrap">
                <table class="admin-orders-table">
                    <thead>
                        <tr>
                            <th>${getT('code') || 'Code'}</th>
                            <th>${getT('discount') || 'Discount'}</th>
                            <th>${getT('minOrder') || 'Min Order'}</th>
                            <th>${getT('uses') || 'Uses'}</th>
                            <th>${getT('validPeriod') || 'Valid Period'}</th>
                            <th>${getT('status') || 'Status'}</th>
                            <th>${getT('actions') || 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody id="adminCouponsBody">
                        <tr><td colspan="7" class="loading-cell">${getT('loading') || 'Loading...'}</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="adminCouponsPagination" class="admin-orders-pagination"></div>
        `;

        await this.fetchCoupons();
    },

    async fetchCoupons() {
        const tbody = document.getElementById('adminCouponsBody');
        if (!tbody) return;

        const params = new URLSearchParams({ page: this.currentPage });
        if (this.searchQuery) params.set('search', this.searchQuery);

        try {
            const resp = await fetch(`${API_URL}/admin/coupons/?${params}`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();
            this.totalCoupons = data.total;
            this.renderTable(data.coupons);
            this.renderPagination();
        } catch (err) {
            logger.error('Failed to fetch coupons:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="error-cell">${translations[state.currentLanguage]?.loadError || 'Failed to load coupons.'}</td></tr>`;
        }
    },

    renderTable(coupons) {
        const tbody = document.getElementById('adminCouponsBody');
        if (!tbody) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        if (coupons.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">${getT('noCouponsFound') || 'No coupons found.'}</td></tr>`;
            return;
        }

        tbody.innerHTML = coupons.map(c => {
            const discountLabel = c.discount_type === 'percentage' ? `${c.discount_value}%` : `$${c.discount_value}`;
            return `
            <tr>
                <td><strong style="text-transform:uppercase;font-family:monospace;">${c.code}</strong></td>
                <td>${discountLabel}</td>
                <td>${c.min_order_amount ? `$${c.min_order_amount}` : '-'}</td>
                <td>${c.usage_count}${c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                <td style="white-space:nowrap;font-size:12px;">
                    ${new Date(c.valid_from).toLocaleDateString()} — ${new Date(c.valid_to).toLocaleDateString()}
                </td>
                <td>
                    <span class="status-badge-small" style="background:${c.is_active ? '#DCFCE7' : '#FEF3C7'};color:${c.is_active ? '#16A34A' : '#D97706'}">
                        ${c.is_active ? (getT('active') || 'Active') : (getT('inactive') || 'Inactive')}
                    </span>
                </td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-secondary btn-sm" onclick="AdminCouponsManager.showEditForm('${c.id}')"
                            title="${getT('edit') || 'Edit'}">✏️</button>
                        <button class="btn btn-secondary btn-sm" style="color:#DC2626;"
                            onclick="AdminCouponsManager.confirmDelete('${c.id}','${c.code}')"
                            title="${getT('delete') || 'Delete'}">🗑️</button>
                    </div>
                </td>
            </tr>`;
        }).join('');
    },

    renderPagination() {
        const container = document.getElementById('adminCouponsPagination');
        if (!container) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const totalPages = Math.ceil(this.totalCoupons / 20);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        container.innerHTML = `
            <button ${this.currentPage <= 1 ? 'disabled' : ''} onclick="AdminCouponsManager.goToPage(${this.currentPage - 1})">← ${getT('prev') || 'Prev'}</button>
            <span>${getT('page') || 'Page'} ${this.currentPage} ${getT('of') || 'of'} ${totalPages}</span>
            <button ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="AdminCouponsManager.goToPage(${this.currentPage + 1})">${getT('next') || 'Next'} →</button>
        `;
    },

    filterChanged() {
        this.searchChanged();
    },

    searchChanged() {
        this.searchQuery = document.getElementById('couponSearch').value;
        this.currentPage = 1;
        this.fetchCoupons();
    },

    goToPage(page) {
        this.currentPage = page;
        this.fetchCoupons();
    },

    showAddForm() {
        this._showCouponForm(null);
    },

    showEditForm(couponId) {
        this._showCouponForm(couponId);
    },

    async _showCouponForm(couponId) {
        const panel = document.getElementById('adminCouponsPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        let coupon = {
            code: '', discount_type: 'percentage', discount_value: '', min_order_amount: '',
            max_uses: '', max_uses_per_user: '', is_active: true,
            valid_from: new Date().toISOString().slice(0, 16), valid_to: new Date(Date.now() + 30*86400000).toISOString().slice(0, 16)
        };
        const isEdit = !!couponId;

        if (isEdit) {
            try {
                const resp = await fetch(`${API_URL}/admin/coupons/${couponId}/`, { headers: getAuthHeaders() });
                if (resp.ok) {
                    const c = await resp.json();
                    coupon = {
                        ...c,
                        valid_from: new Date(c.valid_from).toISOString().slice(0, 16),
                        valid_to: new Date(c.valid_to).toISOString().slice(0, 16),
                    };
                }
            } catch (e) {
                logger.error('Failed to load coupon:', e);
            }
        }

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${isEdit ? (getT('editCoupon') || 'Edit Coupon') : (getT('addCoupon') || 'Add Coupon')}</h2>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="AdminCouponsManager.render()">
                    ← ${getT('backToList') || 'Back to List'}
                </button>
            </div>
            <div class="admin-product-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>${getT('code') || 'Code'} *</label>
                        <input type="text" id="cf_code" value="${coupon.code}" style="text-transform:uppercase;font-family:monospace;" required>
                    </div>
                    <div class="form-group">
                        <label>${getT('discountType') || 'Discount Type'}</label>
                        <select id="cf_discountType">
                            <option value="percentage" ${coupon.discount_type === 'percentage' ? 'selected' : ''}>${getT('percentage') || 'Percentage'}</option>
                            <option value="fixed_amount" ${coupon.discount_type === 'fixed_amount' ? 'selected' : ''}>${getT('fixedAmount') || 'Fixed Amount'}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>${getT('discountValue') || 'Discount Value'} *</label>
                        <input type="number" step="0.01" id="cf_discountValue" value="${coupon.discount_value || ''}" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>${getT('minOrderAmount') || 'Min Order Amount'}</label>
                        <input type="number" step="0.01" id="cf_minOrder" value="${coupon.min_order_amount || ''}" placeholder="0.00">
                    </div>
                    <div class="form-group">
                        <label>${getT('maxUses') || 'Max Uses'}</label>
                        <input type="number" id="cf_maxUses" value="${coupon.max_uses || ''}" placeholder="${getT('unlimited') || 'Unlimited'}">
                    </div>
                    <div class="form-group">
                        <label>${getT('maxUsesPerUser') || 'Max Per User'}</label>
                        <input type="number" id="cf_maxPerUser" value="${coupon.max_uses_per_user || ''}" placeholder="${getT('unlimited') || 'Unlimited'}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>${getT('validFrom') || 'Valid From'}</label>
                        <input type="datetime-local" id="cf_validFrom" value="${coupon.valid_from}">
                    </div>
                    <div class="form-group">
                        <label>${getT('validTo') || 'Valid To'}</label>
                        <input type="datetime-local" id="cf_validTo" value="${coupon.valid_to}">
                    </div>
                    <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:8px;">
                        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                            <input type="checkbox" id="cf_isActive" ${coupon.is_active !== false ? 'checked' : ''}>
                            ${getT('active') || 'Active'}
                        </label>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="AdminCouponsManager.saveCoupon('${couponId || ''}')">
                        ${isEdit ? (getT('update') || 'Update') : (getT('create') || 'Create')}
                    </button>
                    <button class="btn btn-secondary" onclick="AdminCouponsManager.render()">${getT('cancel') || 'Cancel'}</button>
                </div>
            </div>
        `;
    },

    async saveCoupon(couponId) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const isEdit = !!couponId;

        const data = {
            code: document.getElementById('cf_code').value,
            discount_type: document.getElementById('cf_discountType').value,
            discount_value: parseFloat(document.getElementById('cf_discountValue').value) || 0,
            min_order_amount: parseFloat(document.getElementById('cf_minOrder').value) || null,
            max_uses: parseInt(document.getElementById('cf_maxUses').value) || null,
            max_uses_per_user: parseInt(document.getElementById('cf_maxPerUser').value) || null,
            valid_from: document.getElementById('cf_validFrom').value ? new Date(document.getElementById('cf_validFrom').value).toISOString() : null,
            valid_to: document.getElementById('cf_validTo').value ? new Date(document.getElementById('cf_validTo').value).toISOString() : null,
            is_active: document.getElementById('cf_isActive').checked,
        };

        if (!data.code.trim()) {
            showNotification(getT('codeRequired') || 'Coupon code is required.', 'error');
            return;
        }

        const url = isEdit ? `${API_URL}/admin/coupons/${couponId}/` : `${API_URL}/admin/coupons/`;
        const method = isEdit ? 'PATCH' : 'POST';

        try {
            const resp = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(data) });
            if (!resp.ok) {
                const err = await resp.json();
                showNotification(err.detail || 'Failed to save coupon.', 'error');
                return;
            }
            showNotification(isEdit ? 'Coupon updated.' : 'Coupon created.', 'success');
            await this.render();
        } catch (err) {
            logger.error('Failed to save coupon:', err);
            showNotification('Failed to save coupon.', 'error');
        }
    },

    async confirmDelete(couponId, code) {
        if (!confirm(`Delete coupon "${code}"?`)) return;
        try {
            const resp = await fetch(`${API_URL}/admin/coupons/${couponId}/`, {
                method: 'DELETE', headers: getAuthHeaders(),
            });
            if (!resp.ok) throw new Error('Delete failed');
            showNotification(`Coupon "${code}" deleted.`, 'success');
            await this.fetchCoupons();
        } catch (err) {
            logger.error('Failed to delete coupon:', err);
            showNotification('Failed to delete coupon.', 'error');
        }
    },

    goBack() {
        this.hide();
    }
};

window.AdminCouponsManager = AdminCouponsManager;
