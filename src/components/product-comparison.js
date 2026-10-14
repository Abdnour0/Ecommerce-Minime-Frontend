import { logger } from './logger.js';
import { state } from './state.js';
import { escapeHtml, showNotification } from './ui-utils.js';
import { SettingsManager } from './settings.js';

export const ProductComparisonManager = {
    STORAGE_KEY: 'minime_compare',
    MAX_COMPARE: 4,

    get() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            logger.error('Error reading compare items:', e);
            return [];
        }
    },

    add(productId) {
        if (!productId) return { success: false, message: 'Invalid product ID' };

        let items = this.get();

        if (items.includes(productId)) {
            return { success: false, message: 'Product already in comparison' };
        }

        if (items.length >= this.MAX_COMPARE) {
            return { success: false, message: `Maximum ${this.MAX_COMPARE} products can be compared` };
        }

        items.push(productId);

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
            this.renderCompareBar();
            showNotification(SettingsManager.getTranslation('compareAdded') || 'Product added to comparison', 'success');
            return { success: true, message: 'Product added to comparison' };
        } catch (e) {
            logger.error('Error saving compare item:', e);
            return { success: false, message: 'Failed to add product to comparison' };
        }
    },

    remove(productId) {
        if (!productId) return;

        let items = this.get();
        items = items.filter(id => id !== productId);

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
            this.renderCompareBar();
            showNotification(SettingsManager.getTranslation('compareRemoved') || 'Product removed from comparison', 'info');
        } catch (e) {
            logger.error('Error removing compare item:', e);
        }
    },

    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.renderCompareBar();
        showNotification(SettingsManager.getTranslation('compareCleared') || 'Comparison list cleared', 'info');
    },

    isInCompare(productId) {
        return this.get().includes(productId);
    },

    renderCompareBar() {
        let compareBar = document.querySelector('.compare-bar');
        const items = this.get();

        if (items.length === 0) {
            if (compareBar) compareBar.remove();
            return;
        }

        if (!compareBar) {
            compareBar = document.createElement('div');
            compareBar.className = 'compare-bar';
            compareBar.style.cssText = 'position:fixed;bottom:0;left:0;width:100%;background:var(--bg-color,#fff);color:var(--text-color,#000);border-top:2px solid var(--accent-color,#e91e63);padding:0.75rem 1rem;display:flex;align-items:center;justify-content:space-between;z-index:9998;box-shadow:0 -2px 10px rgba(0,0,0,0.1);gap:1rem;flex-wrap:wrap;';
            document.body.appendChild(compareBar);
        }

        const products = items.map(id => state.products.find(p => String(p.id || p._id) === String(id))).filter(Boolean);

        const thumbnailsHtml = products.map(p => `
            <div class="compare-thumb" style="display:flex;align-items:center;gap:0.5rem;position:relative;">
                <img src="${p.image}" alt="${escapeHtml(p.name)}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;border:1px solid var(--border-color,#ddd);">
                <span style="font-size:0.8rem;max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(p.name)}</span>
                <button class="compare-remove-btn" data-product-id="${p.id}" style="background:none;border:none;cursor:pointer;color:var(--text-secondary,#999);font-size:1rem;padding:0;line-height:1;" aria-label="Remove ${escapeHtml(p.name)} from comparison">&times;</button>
            </div>
        `).join('');

        compareBar.innerHTML = `
            <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
                <span style="font-weight:600;font-size:0.9rem;">${SettingsManager.getTranslation('compare') || 'Compare'} (${items.length}/${this.MAX_COMPARE})</span>
                ${thumbnailsHtml}
            </div>
            <div style="display:flex;align-items:center;gap:0.75rem;">
                <button class="compare-btn btn btn-primary" style="padding:0.4rem 1rem;font-size:0.85rem;${items.length < 2 ? 'opacity:0.5;pointer-events:none;' : ''}">${SettingsManager.getTranslation('compare') || 'Compare'}</button>
                <button class="compare-clear-btn" style="background:none;border:none;cursor:pointer;color:var(--text-secondary,#999);font-size:0.8rem;text-decoration:underline;">${SettingsManager.getTranslation('compareCleared') || 'Clear all'}</button>
            </div>
        `;

        compareBar.querySelectorAll('.compare-remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.remove(btn.dataset.productId);
            });
        });

        compareBar.querySelector('.compare-btn').addEventListener('click', () => {
            this.openCompareModal();
        });

        compareBar.querySelector('.compare-clear-btn').addEventListener('click', () => {
            this.clear();
        });
    },

    openCompareModal() {
        const items = this.get();
        if (items.length < 2) {
            showNotification(SettingsManager.getTranslation('compareMinRequired') || 'Add at least 2 products to compare', 'error');
            return;
        }

        const products = items.map(id => state.products.find(p => String(p.id || p._id) === String(id))).filter(Boolean);
        if (products.length < 2) {
            showNotification(SettingsManager.getTranslation('compareUnavailable') || 'Some products are no longer available', 'error');
            return;
        }

        const existingOverlay = document.querySelector('.compare-modal-overlay');
        if (existingOverlay) existingOverlay.remove();

        const overlay = document.createElement('div');
        overlay.className = 'compare-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:1rem;';

        const modal = document.createElement('div');
        modal.className = 'compare-modal';
        modal.style.cssText = 'background:var(--bg-color,#fff);color:var(--text-color,#000);border-radius:12px;max-width:95vw;width:1200px;max-height:90vh;overflow-y:auto;position:relative;padding:2rem;box-shadow:0 4px 20px rgba(0,0,0,0.2);';

        const closeBtn = document.createElement('button');
        closeBtn.className = 'compare-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = 'position:absolute;top:0.75rem;right:1rem;background:none;border:none;font-size:1.8rem;cursor:pointer;color:var(--text-secondary,#999);line-height:1;padding:0;';
        closeBtn.setAttribute('aria-label', 'Close comparison modal');

        const title = document.createElement('h2');
        title.textContent = SettingsManager.getTranslation('productComparison') || 'Product Comparison';
        title.style.cssText = 'margin:0 0 1.5rem 0;font-size:1.5rem;';

        const table = document.createElement('table');
        table.style.cssText = 'width:100%;border-collapse:collapse;';

        const rows = [
            { label: 'Image', key: 'image' },
            { label: 'Name', key: 'name' },
            { label: 'Price', key: 'price' },
            { label: 'Description', key: 'description' },
            { label: 'Material', key: 'material' },
            { label: 'Weight', key: 'weight' },
            { label: 'Origin', key: 'origin' },
            { label: 'Rating', key: 'rating' },
            { label: 'Colors', key: 'colors' },
            { label: 'Sizes', key: 'sizes' },
        ];

        let html = '<thead><tr><th style="text-align:left;padding:0.75rem 1rem;border-bottom:2px solid var(--border-color,#eee);background:var(--bg-secondary,#f9f9f9);font-weight:600;min-width:120px;">Feature</th>';
        products.forEach(p => {
            html += `<th style="text-align:center;padding:0.75rem 1rem;border-bottom:2px solid var(--border-color,#eee);background:var(--bg-secondary,#f9f9f9);min-width:180px;">${escapeHtml(p.name)}</th>`;
        });
        html += '</tr></thead><tbody>';

        rows.forEach(row => {
            html += `<tr><td style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-color,#eee);font-weight:500;">${row.label}</td>`;
            products.forEach(p => {
                let value = '';
                switch (row.key) {
                    case 'image':
                        value = `<img src="${p.image}" alt="${escapeHtml(p.name)}" style="width:100%;max-width:150px;height:auto;object-fit:cover;border-radius:4px;display:block;margin:0 auto;">`;
                        break;
                    case 'name':
                        value = escapeHtml(p.name || '');
                        break;
                    case 'price':
                        value = p.onSale && p.originalPrice ? `<span style="text-decoration:line-through;color:var(--text-secondary,#999);margin-right:0.5rem;">$${Number(p.originalPrice).toFixed(2)}</span> <strong>$${Number(p.price).toFixed(2)}</strong>` : `<strong>$${Number(p.price).toFixed(2)}</strong>`;
                        break;
                    case 'description':
                        value = escapeHtml(p.description || '');
                        break;
                    case 'material':
                        value = escapeHtml(p.material || '-');
                        break;
                    case 'weight':
                        value = escapeHtml(p.weight || '-');
                        break;
                    case 'origin':
                        value = escapeHtml(p.origin || '-');
                        break;
                    case 'rating':
                        const r = p.rating || 0;
                        value = `${'★'.repeat(Math.floor(r))}${r % 1 >= 0.5 ? '½' : ''} (${r})`;
                        break;
                    case 'colors':
                        if (p.colors && p.colors.length > 0) {
                            value = p.colors.map(c => `<span style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${c.hex};margin:2px;border:1px solid var(--border-color,#ddd);vertical-align:middle;" title="${escapeHtml(c.name)}"></span>`).join('');
                        } else {
                            value = '-';
                        }
                        break;
                    case 'sizes':
                        if (p.sizes && p.sizes.length > 0) {
                            value = p.sizes.map(s => `<span style="display:inline-block;padding:2px 8px;margin:2px;border:1px solid var(--border-color,#ddd);border-radius:4px;font-size:0.8rem;">${escapeHtml(s)}</span>`).join('');
                        } else {
                            value = '-';
                        }
                        break;
                }
                html += `<td style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-color,#eee);text-align:center;vertical-align:middle;">${value}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody>';
        table.innerHTML = html;
        modal.appendChild(closeBtn);
        modal.appendChild(title);
        modal.appendChild(table);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        const close = () => overlay.remove();

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handler); }
        });
    },

    renderCompareCheckbox(container, productId) {
        if (!container) return;

        const isChecked = this.isInCompare(productId);
        const wrapper = document.createElement('div');
        wrapper.className = 'compare-checkbox-wrapper';
        wrapper.style.cssText = 'margin-top:0.5rem;display:flex;align-items:center;gap:0.35rem;';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'compare-checkbox';
        checkbox.id = `compare-${productId}`;
        checkbox.checked = isChecked;

        const label = document.createElement('label');
        label.htmlFor = `compare-${productId}`;
        label.textContent = 'Compare';
        label.style.cssText = 'font-size:0.8rem;cursor:pointer;color:var(--text-secondary,#666);user-select:none;';

        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                const result = this.add(productId);
                if (!result.success) {
                    checkbox.checked = false;
                    showNotification(result.message, 'error');
                }
            } else {
                this.remove(productId);
            }
        });

        wrapper.appendChild(checkbox);
        wrapper.appendChild(label);
        container.appendChild(wrapper);
    }
};
