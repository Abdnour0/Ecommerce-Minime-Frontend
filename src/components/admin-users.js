import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const AdminUsersManager = {
    currentPage: 1,
    searchQuery: '',
    staffFilter: '',
    activeFilter: '',
    totalUsers: 0,

    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminUsersPanel');
        if (existing) existing.remove();

        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminUsersPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminUsersPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminUsersPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('manageUsers') || 'Manage Users'}</h2>
                    <p>${getT('manageUsersDesc') || 'View and manage customer accounts'}</p>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="AdminUsersManager.goBack()">
                    ← ${getT('backToDashboard') || 'Back to Dashboard'}
                </button>
            </div>
            <div class="admin-orders-filters">
                <select id="adminUserStaffFilter" onchange="AdminUsersManager.filterChanged()">
                    <option value="" data-translate="allRoles">All Roles</option>
                    <option value="true" data-translate="staffOnly">Staff Only</option>
                    <option value="false" data-translate="customersOnly">Customers Only</option>
                </select>
                <select id="adminUserActiveFilter" onchange="AdminUsersManager.filterChanged()">
                    <option value="" data-translate="allStatus">All Status</option>
                    <option value="true" data-translate="active">Active</option>
                    <option value="false" data-translate="inactive">Inactive</option>
                </select>
                <input type="text" id="adminUserSearch" placeholder="${getT('searchUsers') || 'Search users...'}"
                    onkeydown="if(event.key==='Enter') AdminUsersManager.searchChanged()">
                <button class="btn btn-primary btn-sm" onclick="AdminUsersManager.searchChanged()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    ${getT('search') || 'Search'}
                </button>
            </div>
            <div class="admin-orders-table-wrap">
                <table class="admin-orders-table">
                    <thead>
                        <tr>
                            <th>${getT('username') || 'Username'}</th>
                            <th>${getT('email') || 'Email'}</th>
                            <th>${getT('name') || 'Name'}</th>
                            <th>${getT('role') || 'Role'}</th>
                            <th>${getT('status') || 'Status'}</th>
                            <th>${getT('orders') || 'Orders'}</th>
                            <th>${getT('spent') || 'Spent'}</th>
                            <th>${getT('joined') || 'Joined'}</th>
                            <th>${getT('actions') || 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody id="adminUsersBody">
                        <tr><td colspan="9" class="loading-cell">${getT('loading') || 'Loading...'}</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="adminUsersPagination" class="admin-orders-pagination"></div>
        `;

        await this.fetchUsers();
    },

    async fetchUsers() {
        const tbody = document.getElementById('adminUsersBody');
        if (!tbody) return;

        const params = new URLSearchParams({ page: this.currentPage });
        if (this.searchQuery) params.set('search', this.searchQuery);
        if (this.staffFilter) params.set('is_staff', this.staffFilter);
        if (this.activeFilter) params.set('is_active', this.activeFilter);

        try {
            const resp = await fetch(`${API_URL}/admin/users/?${params}`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();
            this.totalUsers = data.total;
            this.renderTable(data.users);
            this.renderPagination();
        } catch (err) {
            logger.error('Failed to fetch users:', err);
            tbody.innerHTML = `<tr><td colspan="9" class="error-cell">${translations[state.currentLanguage]?.loadError || 'Failed to load users.'}</td></tr>`;
        }
    },

    renderTable(users) {
        const tbody = document.getElementById('adminUsersBody');
        if (!tbody) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="empty-cell">${getT('noUsersFound') || 'No users found.'}</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td><strong>${u.username}</strong></td>
                <td>${u.email}</td>
                <td>${u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : '-'}</td>
                <td>
                    ${u.is_superuser
                        ? `<span class="status-badge-small" style="background-color:#8B5CF615;color:#8B5CF6;">Superadmin</span>`
                        : u.is_staff
                            ? `<span class="status-badge-small" style="background-color:#3B82F615;color:#3B82F6;">Staff</span>`
                            : `<span class="status-badge-small" style="background-color:#62656715;color:#626567;">Customer</span>`
                    }
                </td>
                <td>
                    <span class="status-badge-small" style="background-color:${u.is_active ? '#16A34A15' : '#DC262615'};color:${u.is_active ? '#16A34A' : '#DC2626'};">
                        ${u.is_active ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td>${u.order_count}</td>
                <td><strong>$${u.total_spent.toFixed(2)}</strong></td>
                <td><small>${new Date(u.date_joined).toLocaleDateString()}</small></td>
                <td>
                    <div style="display:flex;gap:6px;">
                        ${!u.is_superuser ? `
                            <button class="btn btn-secondary btn-sm" onclick="AdminUsersManager.toggleStatus('${u.id}','${u.username.replace(/'/g, "\\'")}',${u.is_active})"
                                title="${u.is_active ? (getT('deactivate') || 'Deactivate') : (getT('activate') || 'Activate')}">
                                ${u.is_active ? '🔒' : '🔓'}
                            </button>
                            <button class="btn btn-secondary btn-sm" onclick="AdminUsersManager.confirmDelete('${u.id}','${u.username.replace(/'/g, "\\'")}')"
                                title="${getT('delete') || 'Delete'}" style="color:#DC2626;">🗑️</button>
                        ` : '<span style="color:#999;font-size:12px;">-</span>'}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination() {
        const container = document.getElementById('adminUsersPagination');
        if (!container) return;
        const totalPages = Math.ceil(this.totalUsers / 20);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        container.innerHTML = `
            <button ${this.currentPage <= 1 ? 'disabled' : ''} onclick="AdminUsersManager.goToPage(${this.currentPage - 1})">← Prev</button>
            <span>Page ${this.currentPage} of ${totalPages}</span>
            <button ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="AdminUsersManager.goToPage(${this.currentPage + 1})">Next →</button>
        `;
    },

    filterChanged() {
        this.staffFilter = document.getElementById('adminUserStaffFilter').value;
        this.activeFilter = document.getElementById('adminUserActiveFilter').value;
        this.currentPage = 1;
        this.fetchUsers();
    },

    searchChanged() {
        this.searchQuery = document.getElementById('adminUserSearch').value;
        this.currentPage = 1;
        this.fetchUsers();
    },

    goToPage(page) {
        this.currentPage = page;
        this.fetchUsers();
    },

    async toggleStatus(userId, username, currentlyActive) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        try {
            const resp = await fetch(`${API_URL}/admin/users/${userId}/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ is_active: !currentlyActive }),
            });
            if (!resp.ok) throw new Error('Toggle failed');
            showNotification(`"${username}" ${currentlyActive ? getT('deactivated') || 'deactivated' : getT('activated') || 'activated'}`, 'success');
            await this.fetchUsers();
        } catch (err) {
            logger.error('Failed to toggle user:', err);
            showNotification(getT('toggleFailed') || 'Failed to update user.', 'error');
        }
    },

    async confirmDelete(userId, username) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        if (!confirm(`${getT('confirmDeleteUser') || 'Delete user'} "${username}"? ${getT('confirmDeleteUserDesc') || 'This will permanently remove the account.'}`)) return;

        try {
            const resp = await fetch(`${API_URL}/admin/users/${userId}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!resp.ok) {
                const err = await resp.json();
                showNotification(err.detail || 'Failed to delete user.', 'error');
                return;
            }
            showNotification(`"${username}" ${getT('deleted') || 'deleted.'}`, 'success');
            await this.fetchUsers();
        } catch (err) {
            logger.error('Failed to delete user:', err);
            showNotification(getT('deleteFailed') || 'Failed to delete user.', 'error');
        }
    },

    goBack() {
        this.hide();
    }
};

window.AdminUsersManager = AdminUsersManager;
