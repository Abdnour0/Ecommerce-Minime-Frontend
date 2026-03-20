export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';

    const colors = {
        error: '#DC2626',
        info: '#3B82F6',
        success: '#F37021'
    };

    notification.style.background = colors[type] || colors.success;
    notification.innerHTML = `<span>${escapeHtml(message)}</span>`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function showConfirmDialog(message, onConfirm) {
    const dialog = document.createElement('div');
    dialog.className = 'confirm-dialog-overlay';
    dialog.style.position = 'fixed';
    dialog.style.top = '0';
    dialog.style.left = '0';
    dialog.style.width = '100%';
    dialog.style.height = '100%';
    dialog.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';
    dialog.style.zIndex = '9999';

    const content = document.createElement('div');
    content.style.backgroundColor = 'var(--bg-color, white)';
    content.style.color = 'var(--text-color, black)';
    content.style.padding = '2rem';
    content.style.borderRadius = '8px';
    content.style.maxWidth = '400px';
    content.style.width = '90%';
    content.style.textAlign = 'center';
    content.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';

    const text = document.createElement('p');
    text.textContent = message;
    text.style.marginBottom = '1.5rem';
    text.style.fontSize = '1.1rem';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '1rem';
    btnContainer.style.justifyContent = 'center';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.className = 'btn btn-outline';
    cancelBtn.onclick = () => dialog.remove();

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = 'Confirm';
    confirmBtn.className = 'btn btn-primary';
    confirmBtn.onclick = () => {
        dialog.remove();
        onConfirm();
    };

    btnContainer.appendChild(cancelBtn);
    btnContainer.appendChild(confirmBtn);
    content.appendChild(text);
    content.appendChild(btnContainer);
    dialog.appendChild(content);

    document.body.appendChild(dialog);
}

export function trapFocus(element) {
    const focusableEls = element.querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled])');
    if (!focusableEls.length) return;
    const firstFocusableEl = focusableEls[0];  
    const lastFocusableEl = focusableEls[focusableEls.length - 1];
    
    if (element._focusTrapController) {
        element._focusTrapController.abort();
    }
    const controller = new AbortController();
    element._focusTrapController = controller;

    element.addEventListener('keydown', function(e) {
        const isTabPressed = e.key === 'Tab' || e.keyCode === 9;
        
        if (!isTabPressed) return;
        
        if (e.shiftKey) { /* shift + tab */
            if (document.activeElement === firstFocusableEl) {
                lastFocusableEl.focus();
                e.preventDefault();
            }
        } else { /* tab */
            if (document.activeElement === lastFocusableEl) {
                firstFocusableEl.focus();
                e.preventDefault();
            }
        }
    }, { signal: controller.signal });
}
