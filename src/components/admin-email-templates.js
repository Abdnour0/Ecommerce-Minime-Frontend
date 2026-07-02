import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const AdminEmailTemplatesManager = {
    templates: [],

    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminEmailTemplatesPanel');
        if (existing) existing.remove();

        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminEmailTemplatesPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminEmailTemplatesPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminEmailTemplatesPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('emailTemplates') || 'Email Templates'}</h2>
                    <p>${getT('emailTemplatesDesc') || 'Edit order confirmation and notification emails'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-secondary btn-sm" onclick="AdminEmailTemplatesManager.goBack()">
                        ← ${getT('backToDashboard') || 'Back to Dashboard'}
                    </button>
                </div>
            </div>
            <div id="adminEmailTemplateList">
                <div class="loading-cell">${getT('loading') || 'Loading...'}</div>
            </div>
            <div id="adminEmailTemplateEditor" style="display:none;"></div>
        `;

        await this.fetchTemplates();
    },

    async fetchTemplates() {
        const container = document.getElementById('adminEmailTemplateList');
        if (!container) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        try {
            const resp = await fetch(`${API_URL}/admin/email-templates/`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();
            this.templates = data.templates;

            container.innerHTML = `
                <div class="admin-orders-table-wrap" style="margin-top:16px;">
                    <table class="admin-orders-table">
                        <thead>
                            <tr>
                                <th>${getT('templateName') || 'Template'}</th>
                                <th>${getT('status') || 'Status'}</th>
                                <th>${getT('lastUpdated') || 'Last Updated'}</th>
                                <th>${getT('actions') || 'Actions'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.templates.map(t => `
                                <tr>
                                    <td><strong>${t.display_name}</strong><br><small style="color:#666;">${t.name}</small></td>
                                    <td><span class="status-badge-small" style="background:${t.is_active ? '#DCFCE7' : '#FEF3C7'};color:${t.is_active ? '#16A34A' : '#D97706'}">${t.is_active ? (getT('active') || 'Active') : (getT('inactive') || 'Inactive')}</span></td>
                                    <td><small>${t.updated_at ? new Date(t.updated_at).toLocaleString() : '-'}</small></td>
                                    <td>
                                        <button class="btn btn-primary btn-sm" onclick="AdminEmailTemplatesManager.editTemplate('${t.name}')">
                                            ${getT('edit') || 'Edit'}
                                        </button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${this.templates.length === 0 ? '<tr><td colspan="4" class="empty-cell">No templates found.</td></tr>' : ''}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (err) {
            logger.error('Failed to fetch templates:', err);
            container.innerHTML = `<div class="error-cell">${getT('loadError') || 'Failed to load templates.'}</div>`;
        }
    },

    async editTemplate(name) {
        const editor = document.getElementById('adminEmailTemplateEditor');
        const list = document.getElementById('adminEmailTemplateList');
        if (!editor || !list) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        try {
            const resp = await fetch(`${API_URL}/admin/email-templates/${name}/`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const t = await resp.json();

            list.style.display = 'none';
            editor.style.display = 'block';
            editor.innerHTML = `
                <div class="admin-product-form">
                    <h3>${getT('editTemplate') || 'Edit Template'}: ${t.display_name}</h3>
                    <div class="form-group">
                        <label>${getT('displayName') || 'Display Name'}</label>
                        <input type="text" id="emailTemplateDisplayName" value="${t.display_name}" class="form-input">
                    </div>
                    <div class="form-group">
                        <label>${getT('subject') || 'Subject'}</label>
                        <input type="text" id="emailTemplateSubject" value="${t.subject.replace(/"/g, '&quot;')}" class="form-input">
                        <small style="color:#666;">${getT('templateVarsHelp') || 'Use {{ variable }} syntax for dynamic values'}</small>
                    </div>
                    <div class="form-group">
                        <label>${getT('htmlBody') || 'HTML Body'}</label>
                        <textarea id="emailTemplateBody" rows="20" class="form-input" style="font-family:monospace;font-size:13px;">${t.body_html}</textarea>
                    </div>
                    <div class="form-group" style="flex-direction:row;align-items:center;gap:12px;">
                        <label style="margin:0;">${getT('active') || 'Active'}</label>
                        <input type="checkbox" id="emailTemplateActive" ${t.is_active ? 'checked' : ''}>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:16px;">
                        <button class="btn btn-primary" onclick="AdminEmailTemplatesManager.saveTemplate('${t.name}')">
                            ${getT('save') || 'Save'}
                        </button>
                        <button class="btn btn-secondary" onclick="AdminEmailTemplatesManager.cancelEdit()">
                            ${getT('cancel') || 'Cancel'}
                        </button>
                    </div>
                </div>
            `;
        } catch (err) {
            logger.error('Failed to load template:', err);
            showNotification('Failed to load template.', 'error');
        }
    },

    async saveTemplate(name) {
        const subject = document.getElementById('emailTemplateSubject').value;
        const bodyHtml = document.getElementById('emailTemplateBody').value;
        const displayName = document.getElementById('emailTemplateDisplayName').value;
        const isActive = document.getElementById('emailTemplateActive').checked;

        try {
            const resp = await fetch(`${API_URL}/admin/email-templates/${name}/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ subject, body_html: bodyHtml, display_name: displayName, is_active: isActive }),
            });
            if (!resp.ok) throw new Error('Save failed');
            showNotification('Template saved.', 'success');
            this.cancelEdit();
        } catch (err) {
            logger.error('Failed to save template:', err);
            showNotification('Failed to save template.', 'error');
        }
    },

    cancelEdit() {
        const editor = document.getElementById('adminEmailTemplateEditor');
        const list = document.getElementById('adminEmailTemplateList');
        if (editor) editor.style.display = 'none';
        if (list) list.style.display = 'block';
        this.fetchTemplates();
    },

    goBack() {
        this.hide();
    }
};

window.AdminEmailTemplatesManager = AdminEmailTemplatesManager;
