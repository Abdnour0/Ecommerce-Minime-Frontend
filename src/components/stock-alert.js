import { API_CONFIG, getUrl } from './api-config.js';
import { showNotification } from './ui-utils.js';
import { SettingsManager } from './settings.js';

export async function handleStockAlert(productId) {
    let email = null;
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser && currentUser.email) {
        email = currentUser.email;
    } else {
        email = prompt(SettingsManager.getTranslation('stockAlertPrompt') || 'Enter your email to be notified:');
        if (!email) {
            showNotification('Email is required to set up a stock alert.', 'error');
            return;
        }
    }

    try {
        const response = await fetch(getUrl(API_CONFIG.ENDPOINTS.STOCK_ALERTS), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, product_id: productId }),
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.detail || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        const msg = data.detail || SettingsManager.getTranslation('stockAlertSuccess') || 'You will be notified when this item is back in stock!';
        showNotification(msg, 'success');
    } catch (error) {
        showNotification(error.message || 'Failed to set up stock alert. Please try again.', 'error');
    }
}

export function renderStockAlertButton(container, productId, stockQuantity) {
    if (stockQuantity > 0) return;

    const btn = document.createElement('button');
    btn.className = 'stock-alert-btn';
    btn.textContent = SettingsManager.getTranslation('notifyWhenBack') || 'Notify me when back in stock';
    btn.setAttribute('data-product-id', productId);
    btn.addEventListener('click', () => handleStockAlert(productId));
    container.appendChild(btn);
}
