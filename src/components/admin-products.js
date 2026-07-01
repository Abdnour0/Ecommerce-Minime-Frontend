import { logger } from './logger.js';
import translations from './translations.js';
import { state } from './state.js';
import { API_URL } from '../config.js';
import { showNotification } from './ui-utils.js';

function getAuthHeaders() {
    const token = state.token || localStorage.getItem('accessToken');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : {};
}

export const AdminProductsManager = {
    currentPage: 1,
    searchQuery: '',
    categoryFilter: '',
    totalProducts: 0,
    categories: [],

    async show() {
        const dashboardGrid = document.querySelector('.dashboard-grid');
        const existing = document.getElementById('adminProductsPanel');
        if (existing) existing.remove();

        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = 'none');

        const panel = document.createElement('div');
        panel.id = 'adminProductsPanel';
        panel.className = 'admin-orders-panel';
        dashboardGrid.appendChild(panel);

        await this.render();
    },

    hide() {
        const panel = document.getElementById('adminProductsPanel');
        if (panel) panel.remove();
        document.querySelectorAll('.dashboard-controls, .stats-cards, .charts-grid, .quick-actions-card, .recent-orders-card')
            .forEach(el => el.style.display = '');
    },

    async render() {
        const panel = document.getElementById('adminProductsPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        await this._fetchCategories();

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('manageProducts') || 'Manage Products'}</h2>
                    <p>${getT('manageProductsDesc') || 'Add, edit, and remove products'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-primary btn-sm" onclick="AdminProductsManager.showAddForm()">
                        + ${getT('addProduct') || 'Add Product'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="AdminProductsManager.showImportForm()">
                        ↑ ${getT('importCSV') || 'Import CSV'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="AdminProductsManager.goBack()">
                        ← ${getT('backToDashboard') || 'Back to Dashboard'}
                    </button>
                </div>
            </div>
            <div class="admin-orders-filters">
                <select id="adminProductCategoryFilter" onchange="AdminProductsManager.filterChanged()">
                    <option value="" data-translate="allCategories">All Categories</option>
                    ${this.categories.map(c => `<option value="${c.slug}">${c.name}</option>`).join('')}
                </select>
                <input type="text" id="adminProductSearch" placeholder="${getT('searchProducts') || 'Search products...'}"
                    onkeydown="if(event.key==='Enter') AdminProductsManager.searchChanged()">
                <button class="btn btn-primary btn-sm" onclick="AdminProductsManager.searchChanged()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    ${getT('search') || 'Search'}
                </button>
            </div>
            <div class="admin-orders-table-wrap">
                <table class="admin-orders-table">
                    <thead>
                        <tr>
                            <th>${getT('image') || 'Image'}</th>
                            <th>${getT('name') || 'Name'}</th>
                            <th>${getT('category') || 'Category'}</th>
                            <th>${getT('price') || 'Price'}</th>
                            <th>${getT('stock') || 'Stock'}</th>
                            <th>${getT('badge') || 'Badge'}</th>
                            <th>${getT('rating') || 'Rating'}</th>
                            <th>${getT('actions') || 'Actions'}</th>
                        </tr>
                    </thead>
                    <tbody id="adminProductsBody">
                        <tr><td colspan="8" class="loading-cell">${getT('loading') || 'Loading...'}</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="adminProductsPagination" class="admin-orders-pagination"></div>
        `;

        await this.fetchProducts();
    },

    async _fetchCategories() {
        try {
            const resp = await fetch(`${API_URL}/admin/categories/`, { headers: getAuthHeaders() });
            if (resp.ok) {
                const data = await resp.json();
                this.categories = data.categories || [];
            }
        } catch (e) {
            logger.error('Failed to fetch categories:', e);
        }
    },

    async fetchProducts() {
        const tbody = document.getElementById('adminProductsBody');
        if (!tbody) return;

        const params = new URLSearchParams({ page: this.currentPage });
        if (this.categoryFilter) params.set('category', this.categoryFilter);
        if (this.searchQuery) params.set('search', this.searchQuery);

        try {
            const resp = await fetch(`${API_URL}/admin/products/?${params}`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();
            this.totalProducts = data.total;
            this.renderTable(data.products);
            this.renderPagination();
        } catch (err) {
            logger.error('Failed to fetch products:', err);
            tbody.innerHTML = `<tr><td colspan="8" class="error-cell">${translations[state.currentLanguage]?.loadError || 'Failed to load products.'}</td></tr>`;
        }
    },

    renderTable(products) {
        const tbody = document.getElementById('adminProductsBody');
        if (!tbody) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        if (products.length === 0) {
            tbody.innerHTML = `<tr><td colspan="8" class="empty-cell">${getT('noProductsFound') || 'No products found.'}</td></tr>`;
            return;
        }

        tbody.innerHTML = products.map(p => `
            <tr>
                <td>
                    ${p.image
                        ? `<img src="${p.image}" alt="${p.name}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;">`
                        : `<div style="width:48px;height:48px;border-radius:6px;background:var(--background-light,#FAFAF9);display:flex;align-items:center;justify-content:center;color:var(--text-muted,#999);font-size:10px;">${getT('noImage') || 'N/A'}</div>`
                    }
                </td>
                <td><strong>${p.name}</strong></td>
                <td>${p.category}</td>
                <td>${p.on_sale ? `<span style="text-decoration:line-through;color:#999;margin-right:4px;">$${p.original_price}</span>` : ''}<strong>$${p.price}</strong></td>
                <td><span style="color:${p.stock < 10 ? '#DC2626' : '#16A34A'};font-weight:600;">${p.stock}</span></td>
                <td>${p.badge ? `<span class="status-badge-small">${p.badge}</span>` : '-'}</td>
                <td>${'★'.repeat(Math.round(p.rating))}${'☆'.repeat(5 - Math.round(p.rating))}</td>
                <td>
                    <div style="display:flex;gap:6px;">
                        <button class="btn btn-secondary btn-sm" onclick="AdminProductsManager.showEditForm('${p.id}')"
                            title="${getT('edit') || 'Edit'}">✏️</button>
                        <button class="btn btn-secondary btn-sm" onclick="AdminProductsManager.showStockHistory('${p.id}','${p.name.replace(/'/g, "\\'")}')"
                            title="${getT('stockHistory') || 'Stock History'}" style="color:#2563EB;">📊</button>
                        <button class="btn btn-secondary btn-sm" onclick="AdminProductsManager.confirmDelete('${p.id}','${p.name.replace(/'/g, "\\'")}')"
                            title="${getT('delete') || 'Delete'}" style="color:#DC2626;">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    renderPagination() {
        const container = document.getElementById('adminProductsPagination');
        if (!container) return;
        const totalPages = Math.ceil(this.totalProducts / 20);
        if (totalPages <= 1) { container.innerHTML = ''; return; }

        container.innerHTML = `
            <button ${this.currentPage <= 1 ? 'disabled' : ''} onclick="AdminProductsManager.goToPage(${this.currentPage - 1})">← Prev</button>
            <span>Page ${this.currentPage} of ${totalPages}</span>
            <button ${this.currentPage >= totalPages ? 'disabled' : ''} onclick="AdminProductsManager.goToPage(${this.currentPage + 1})">Next →</button>
        `;
    },

    filterChanged() {
        this.categoryFilter = document.getElementById('adminProductCategoryFilter').value;
        this.currentPage = 1;
        this.fetchProducts();
    },

    searchChanged() {
        this.searchQuery = document.getElementById('adminProductSearch').value;
        this.currentPage = 1;
        this.fetchProducts();
    },

    goToPage(page) {
        this.currentPage = page;
        this.fetchProducts();
    },

    async confirmDelete(productId, productName) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        if (!confirm(`${getT('confirmDeleteProduct') || 'Delete'} "${productName}"? ${getT('confirmDeleteProductDesc') || 'This action cannot be undone.'}`)) return;

        try {
            const resp = await fetch(`${API_URL}/admin/products/${productId}/`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!resp.ok) throw new Error('Delete failed');
            showNotification(`"${productName}" ${getT('deletedSuccess') || 'deleted.'}`, 'success');
            await this.fetchProducts();
        } catch (err) {
            logger.error('Failed to delete product:', err);
            showNotification(getT('deleteFailed') || 'Failed to delete product.', 'error');
        }
    },

    async showAddForm() {
        await this._showProductForm(null);
    },

    async showEditForm(productId) {
        await this._showProductForm(productId);
    },

    async _showProductForm(productId) {
        const panel = document.getElementById('adminProductsPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        let product = { name: '', description: '', price: '', stock_quantity: '0', on_sale: false, original_price: '', badge: '', material: '', weight: '', origin: '', care_instructions: '', category_id: '', images: [] };
        const isEdit = !!productId;

        if (isEdit) {
            try {
                const resp = await fetch(`${API_URL}/admin/products/${productId}/`, { headers: getAuthHeaders() });
                if (resp.ok) product = await resp.json();
            } catch (e) {
                logger.error('Failed to load product:', e);
            }
        }

        const existingImages = (product.images || []).map(img => `
            <div class="product-image-item" data-image-id="${img.id}" style="position:relative;display:inline-block;margin:4px;">
                <img src="${img.url}" alt="" style="width:80px;height:80px;object-fit:cover;border-radius:6px;border:2px solid ${img.is_primary ? 'var(--primary-color,#B88E2F)' : '#e0e0e0'};">
                <button type="button" class="btn btn-sm" style="position:absolute;top:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:#DC2626;color:#fff;cursor:pointer;font-size:12px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;"
                    onclick="AdminProductsManager.deleteImage('${productId}','${img.id}')" title="${getT('delete') || 'Delete'}">×</button>
                ${img.is_primary ? '' : `<button type="button" style="position:absolute;bottom:-6px;right:-6px;width:20px;height:20px;border-radius:50%;border:none;background:var(--primary-color,#B88E2F);color:#fff;cursor:pointer;font-size:10px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center;"
                    onclick="AdminProductsManager.setPrimaryImage('${productId}','${img.id}')" title="${getT('setPrimary') || 'Set as primary'}">★</button>`}
            </div>
        `).join('');

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${isEdit ? getT('editProduct') || 'Edit Product' : getT('addProduct') || 'Add Product'}</h2>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="AdminProductsManager.render()">
                    ← ${getT('backToList') || 'Back to List'}
                </button>
            </div>
            <div class="admin-product-form">
                <div class="form-row">
                    <div class="form-group">
                        <label>${getT('name') || 'Name'} *</label>
                        <input type="text" id="pf_name" value="${product.name}" required>
                    </div>
                    <div class="form-group">
                        <label>${getT('category') || 'Category'} *</label>
                        <select id="pf_category">
                            ${this.categories.map(c =>
                                `<option value="${c.id}" ${String(product.category_id) === String(c.id) ? 'selected' : ''}>${c.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>${getT('description') || 'Description'}</label>
                    <textarea id="pf_description" rows="3">${product.description || ''}</textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>${getT('price') || 'Price'} *</label>
                        <input type="number" step="0.01" id="pf_price" value="${product.price || ''}" required>
                    </div>
                    <div class="form-group">
                        <label>${getT('stockQuantity') || 'Stock Quantity'}</label>
                        <input type="number" id="pf_stock" value="${product.stock_quantity || 0}">
                    </div>
                    <div class="form-group">
                        <label>${getT('badge') || 'Badge'}</label>
                        <input type="text" id="pf_badge" value="${product.badge || ''}" placeholder="${getT('badgePlaceholder') || 'e.g. New, Bestseller'}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="pf_onSale" ${product.on_sale ? 'checked' : ''}>
                            ${getT('onSale') || 'On Sale'}
                        </label>
                    </div>
                    <div class="form-group">
                        <label>${getT('originalPrice') || 'Original Price'}</label>
                        <input type="number" step="0.01" id="pf_originalPrice" value="${product.original_price || ''}">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>${getT('material') || 'Material'}</label>
                        <input type="text" id="pf_material" value="${product.material || ''}">
                    </div>
                    <div class="form-group">
                        <label>${getT('weight') || 'Weight'}</label>
                        <input type="text" id="pf_weight" value="${product.weight || ''}">
                    </div>
                    <div class="form-group">
                        <label>${getT('origin') || 'Origin'}</label>
                        <input type="text" id="pf_origin" value="${product.origin || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label>${getT('careInstructions') || 'Care Instructions'}</label>
                    <textarea id="pf_care" rows="2">${product.care_instructions || ''}</textarea>
                </div>
                ${isEdit ? `
                <div class="form-group">
                    <label>${getT('images') || 'Images'}</label>
                    <div id="existingImages" class="product-images-grid" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
                        ${existingImages || `<span style="color:var(--text-muted,#999);font-size:13px;">${getT('noImages') || 'No images yet.'}</span>`}
                    </div>
                    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                        <input type="file" id="pf_imageUpload" accept="image/jpeg,image/png,image/webp,image/gif" style="font-size:13px;">
                        <label style="display:flex;align-items:center;gap:4px;font-size:13px;">
                            <input type="checkbox" id="pf_uploadIsPrimary" checked>
                            ${getT('setAsPrimary') || 'Set as primary'}
                        </label>
                        <button class="btn btn-primary btn-sm" onclick="AdminProductsManager.uploadImage('${productId}')">
                            ${getT('upload') || 'Upload'}
                        </button>
                    </div>
                </div>
                ` : `<p style="color:var(--text-muted,#999);font-size:13px;margin-top:8px;">${getT('addImagesAfterSave') || 'Save the product first, then add images.'}</p>`}
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="AdminProductsManager.saveProduct('${productId || ''}')">
                        ${isEdit ? (getT('updateProduct') || 'Update Product') : (getT('createProduct') || 'Create Product')}
                    </button>
                    <button class="btn btn-secondary" onclick="AdminProductsManager.render()">${getT('cancel') || 'Cancel'}</button>
                </div>
            </div>
        `;
    },

    async uploadImage(productId) {
        const fileInput = document.getElementById('pf_imageUpload');
        if (!fileInput || !fileInput.files.length) {
            showNotification('Please select an image file.', 'error');
            return;
        }
        const file = fileInput.files[0];
        const isPrimary = document.getElementById('pf_uploadIsPrimary')?.checked || false;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('is_primary', isPrimary);

        try {
            const token = state.token || localStorage.getItem('accessToken');
            const resp = await fetch(`${API_URL}/admin/products/${productId}/images/upload/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            if (!resp.ok) {
                const err = await resp.json();
                showNotification(err.detail || 'Upload failed.', 'error');
                return;
            }
            showNotification('Image uploaded.', 'success');
            await this._showProductForm(productId);
        } catch (err) {
            logger.error('Upload failed:', err);
            showNotification('Upload failed.', 'error');
        }
    },

    async deleteImage(productId, imageId) {
        try {
            const resp = await fetch(`${API_URL}/admin/products/${productId}/images/?image_id=${imageId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!resp.ok) throw new Error('Delete failed');
            showNotification('Image deleted.', 'success');
            await this._showProductForm(productId);
        } catch (err) {
            logger.error('Failed to delete image:', err);
            showNotification('Failed to delete image.', 'error');
        }
    },

    async saveProduct(productId) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const data = {
            name: document.getElementById('pf_name').value,
            category: document.getElementById('pf_category').value,
            description: document.getElementById('pf_description').value,
            price: parseFloat(document.getElementById('pf_price').value) || 0,
            stock_quantity: parseInt(document.getElementById('pf_stock').value) || 0,
            badge: document.getElementById('pf_badge').value,
            on_sale: document.getElementById('pf_onSale').checked,
            original_price: parseFloat(document.getElementById('pf_originalPrice').value) || null,
            material: document.getElementById('pf_material').value,
            weight: document.getElementById('pf_weight').value,
            origin: document.getElementById('pf_origin').value,
            care_instructions: document.getElementById('pf_care').value,
        };

        if (!data.name) {
            showNotification(getT('nameRequired') || 'Product name is required.', 'error');
            return;
        }
        if (!data.price || data.price <= 0) {
            showNotification(getT('priceRequired') || 'Valid price is required.', 'error');
            return;
        }

        const isEdit = !!productId;
        const url = isEdit ? `${API_URL}/admin/products/${productId}/` : `${API_URL}/admin/products/`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const resp = await fetch(url, {
                method,
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            if (!resp.ok) {
                const err = await resp.json();
                showNotification(err.detail || (isEdit ? getT('updateFailed') || 'Update failed.' : getT('createFailed') || 'Create failed.'), 'error');
                return;
            }
            showNotification(isEdit ? getT('productUpdated') || 'Product updated.' : getT('productCreated') || 'Product created.', 'success');
            await this.render();
        } catch (err) {
            logger.error('Failed to save product:', err);
            showNotification(getT('saveFailed') || 'Failed to save product.', 'error');
        }
    },

    async showStockHistory(productId, productName) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const panel = document.getElementById('adminProductsPanel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('stockHistory') || 'Stock History'} — ${productName}</h2>
                </div>
                <button class="btn btn-secondary btn-sm" onclick="AdminProductsManager.render()">
                    ← ${getT('backToList') || 'Back to List'}
                </button>
            </div>
            <div id="stockHistoryBody" class="admin-orders-table-wrap">
                <table class="admin-orders-table">
                    <thead>
                        <tr>
                            <th>${getT('date') || 'Date'}</th>
                            <th>${getT('change') || 'Change'}</th>
                            <th>${getT('from') || 'From'}</th>
                            <th>${getT('to') || 'To'}</th>
                            <th>${getT('reason') || 'Reason'}</th>
                            <th>${getT('by') || 'By'}</th>
                            <th>${getT('order') || 'Order'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td colspan="7" class="loading-cell">${getT('loading') || 'Loading...'}</td></tr>
                    </tbody>
                </table>
            </div>
            <div id="stockHistoryPagination" class="admin-orders-pagination"></div>
        `;

        await this._fetchStockHistory(productId, 1);
    },

    async _fetchStockHistory(productId, page) {
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;
        const tbody = document.querySelector('#stockHistoryBody tbody');
        if (!tbody) return;

        try {
            const resp = await fetch(`${API_URL}/admin/products/${productId}/stock-history/?page=${page}`, { headers: getAuthHeaders() });
            if (!resp.ok) throw new Error(`API error: ${resp.status}`);
            const data = await resp.json();

            if (data.changes.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" class="empty-cell">${getT('noStockChanges') || 'No stock changes recorded.'}</td></tr>`;
                return;
            }

            const reasonLabels = {
                order_placed: getT('orderPlaced') || 'Order Placed',
                order_cancelled: getT('orderCancelled') || 'Order Cancelled',
                admin_update: getT('adminUpdate') || 'Admin Update',
                manual_adjustment: getT('manualAdjustment') || 'Manual Adjustment',
            };

            tbody.innerHTML = data.changes.map(c => `
                <tr>
                    <td style="white-space:nowrap;font-size:12px;">${new Date(c.created_at).toLocaleString()}</td>
                    <td style="color:${c.change > 0 ? '#16A34A' : '#DC2626'};font-weight:600;">${c.change > 0 ? '+' : ''}${c.change}</td>
                    <td>${c.old_quantity}</td>
                    <td>${c.new_quantity}</td>
                    <td><span class="status-badge-small" style="background:var(--background-light,#F5F5F4);">${reasonLabels[c.reason] || c.reason}</span></td>
                    <td>${c.actor || '-'}</td>
                    <td>${c.order_id ? `<a href="#" onclick="return false;" style="color:var(--primary-color,#B88E2F);">#${c.order_id.slice(-6)}</a>` : '-'}</td>
                </tr>
            `).join('');

            const pagination = document.getElementById('stockHistoryPagination');
            const totalPages = Math.ceil(data.total / data.page_size);
            if (totalPages > 1) {
                pagination.innerHTML = `
                    <button ${page <= 1 ? 'disabled' : ''} onclick="AdminProductsManager._fetchStockHistory('${productId}', ${page - 1})">← Prev</button>
                    <span>${getT('page') || 'Page'} ${page} ${getT('of') || 'of'} ${totalPages}</span>
                    <button ${page >= totalPages ? 'disabled' : ''} onclick="AdminProductsManager._fetchStockHistory('${productId}', ${page + 1})">Next →</button>
                `;
            } else {
                pagination.innerHTML = '';
            }
        } catch (err) {
            logger.error('Failed to fetch stock history:', err);
            if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="error-cell">${getT('loadError') || 'Failed to load stock history.'}</td></tr>`;
        }
    },

    showImportForm() {
        const panel = document.getElementById('adminProductsPanel');
        if (!panel) return;
        const getT = (k) => translations[state.currentLanguage]?.[k] || translations.en[k] || k;

        panel.innerHTML = `
            <div class="admin-orders-header">
                <div>
                    <h2>${getT('importProducts') || 'Import Products'}</h2>
                    <p>${getT('importProductsDesc') || 'Upload a CSV file to bulk create products'}</p>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap">
                    <button class="btn btn-secondary btn-sm" onclick="AdminProductsManager.downloadTemplate()">
                        ↓ ${getT('downloadTemplate') || 'Download Template'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="AdminProductsManager.render()">
                        ← ${getT('backToList') || 'Back to List'}
                    </button>
                </div>
            </div>
            <div class="admin-product-form" style="max-width:600px;">
                <div class="form-group">
                    <label>${getT('selectCSV') || 'Select CSV File'}</label>
                    <input type="file" id="importCsvFile" accept=".csv" style="font-size:13px;">
                </div>
                <div class="form-group">
                    <label>${getT('csvColumns') || 'Required columns'}: <code>name, category, price</code></label>
                    <p style="font-size:12px;color:#78716C;margin:4px 0 0;">
                        ${getT('csvOptional') || 'Optional'}: description, stock_quantity, on_sale, original_price, badge, material, weight, origin, care_instructions
                    </p>
                </div>
                <div id="importResult" style="margin-top:12px;"></div>
                <div class="form-actions">
                    <button class="btn btn-primary" onclick="AdminProductsManager.importProducts()">
                        ↑ ${getT('import') || 'Import'}
                    </button>
                    <button class="btn btn-secondary" onclick="AdminProductsManager.render()">${getT('cancel') || 'Cancel'}</button>
                </div>
            </div>
        `;
    },

    async downloadTemplate() {
        const token = state.token || localStorage.getItem('accessToken');
        try {
            const resp = await fetch(`${API_URL}/admin/products/import/template/`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!resp.ok) throw new Error('Download failed');
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'product_import_template.csv';
            a.click();
            URL.revokeObjectURL(url);
        } catch (err) {
            logger.error('Failed to download template:', err);
            showNotification('Failed to download template.', 'error');
        }
    },

    async importProducts() {
        const fileInput = document.getElementById('importCsvFile');
        if (!fileInput || !fileInput.files.length) {
            showNotification('Please select a CSV file.', 'error');
            return;
        }

        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file);

        const resultDiv = document.getElementById('importResult');
        if (resultDiv) resultDiv.innerHTML = '<div class="loading-cell">Importing...</div>';

        try {
            const token = state.token || localStorage.getItem('accessToken');
            const resp = await fetch(`${API_URL}/admin/products/import/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await resp.json();

            if (resultDiv) {
                if (resp.ok) {
                    resultDiv.innerHTML = `
                        <div style="padding:12px;border-radius:6px;background:#DCFCE7;color:#16A34A;">
                            <strong>${data.created} ${data.created === 1 ? 'product' : 'products'} created.</strong>
                            ${data.skipped ? `<br><span style="color:#D97706;">${data.skipped} skipped.</span>` : ''}
                            ${data.errors?.length ? `<div style="margin-top:8px;font-size:12px;color:#DC2626;">${data.errors.slice(0,5).join('<br>')}</div>` : ''}
                        </div>
                    `;
                } else {
                    resultDiv.innerHTML = `<div style="padding:12px;border-radius:6px;background:#FEF3C7;color:#D97706;">${data.detail || 'Import failed.'}</div>`;
                }
            }
            if (resp.ok) {
                showNotification(`${data.created} products imported.`, 'success');
            }
        } catch (err) {
            logger.error('Import failed:', err);
            showNotification('Import failed.', 'error');
            if (resultDiv) resultDiv.innerHTML = '<div style="padding:12px;border-radius:6px;background:#FEF3C7;color:#DC2626;">Import failed.</div>';
        }
    },

    async setPrimaryImage(productId, imageId) {
        try {
            const resp = await fetch(`${API_URL}/admin/products/${productId}/images/`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({ image_id: imageId, is_primary: true }),
            });
            if (!resp.ok) throw new Error('Failed to set primary');
            showNotification('Primary image updated.', 'success');
            await this._showProductForm(productId);
        } catch (err) {
            logger.error('Failed to set primary image:', err);
            showNotification('Failed to set primary image.', 'error');
        }
    },

    goBack() {
        this.hide();
    }
};

window.AdminProductsManager = AdminProductsManager;
