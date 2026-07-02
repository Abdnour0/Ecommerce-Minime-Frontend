import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const AdminBackupManager = {
    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminBackupPanel');
        if (existing) existing.remove();

        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminBackupPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminBackupPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminBackupPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('backups') || 'Backups'}</h2>
                    <p>${getT('backupsDesc') || 'Create and download database backups'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-primary btn-sm" onclick="AdminBackupManager.createBackup()">
                        + ${getT('newBackup') || 'New Backup'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="AdminBackupManager.goBack()">
                        ← ${getT('backToDashboard') || 'Back to Dashboard'}
                    </button>
                </div>
            </div>
            <div class="admin-orders-table-wrap" style="margin-top:16px;">
                <table class="admin-orders-table">
                    <thead>
                        <tr>
                            <th>${getT('filename') || 'Filename'}</th>
                            <th>${getT('size') || 'Size'}</th>
                            <th>${getT('date') || 'Date'}</th>
                            <th>${getT('actions') || 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody id="adminBackupBody">
                        <tr><td colspan="4" class="loading-cell">${getT('loading') || 'Loading...'}</td></tr>
                    </tbody>
                </table>
            </div>
        `;

        await this.fetchBackups();
    },

    async fetchBackups() {
        const tbody = document.getElementById('adminBackupBody');
        if (!tbody) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        try {
            const resp = await fetch(`${API_URL}/admin/backups/`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();

            if (data.backups.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="empty-cell">${getT('noBackups') || 'No backups yet.'}</td></tr>`;
                return;
            }

            tbody.innerHTML = data.backups.map(b => `
                <tr>
                    <td><code>${b.filename}</code></td>
                    <td>${b.size_display}</td>
                    <td><small>${new Date(b.created_at).toLocaleString()}</small></td>
                    <td>
                        <div style="display:flex;gap:6px;">
                            <button class="btn btn-primary btn-sm" onclick="AdminBackupManager.downloadBackup('${b.filename}')">
                                ${getT('download') || 'Download'}
                            </button>
                            <button class="btn btn-secondary btn-sm" style="color:#DC2626;"
                                onclick="AdminBackupManager.confirmDelete('${b.filename}')">
                                ${getT('delete') || 'Delete'}
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            logger.error('Failed to fetch backups:', err);
            tbody.innerHTML = `<tr><td colspan="4" class="error-cell">${getT('loadError') || 'Failed to load backups.'}</td></tr>`;
        }
    },

    async createBackup() {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const btn = document.querySelector('[onclick="AdminBackupManager.createBackup()"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Creating...'; }

        try {
            const resp = await fetch(`${API_URL}/admin/backups/`, {
                method: 'POST',
                headers: getAuthHeaders(),
            });
            if (!resp.ok) throw new Error('Backup failed');
            showNotification('Backup created.', 'success');
            await this.fetchBackups();
        } catch (err) {
            logger.error('Failed to create backup:', err);
            showNotification('Failed to create backup.', 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '+ New Backup'; }
        }
    },

    async downloadBackup(filename) {
        try {
            const resp = await fetch(`${API_URL}/admin/backups/${filename}/`, {
                headers: { 'Authorization': `Bearer ${state.token || localStorage.getItem('accessToken')}` },
            });
            if (!resp.ok) throw new Error('Download failed');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            logger.error('Failed to download backup:', err);
            showNotification('Failed to download backup.', 'error');
        }
    },

    async confirmDelete(filename) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        if (!confirm(`${getT('confirmDeleteBackup') || 'Delete this backup?'}`)) return;

        try {
            const resp = await fetch(`${API_URL}/admin/backups/${filename}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!resp.ok) throw new Error('Delete failed');
            showNotification('Backup deleted.', 'success');
            await this.fetchBackups();
        } catch (err) {
            logger.error('Failed to delete backup:', err);
            showNotification('Failed to delete backup.', 'error');
        }
    },

    goBack() {
        this.hide();
    }
};

window.AdminBackupManager = AdminBackupManager;
