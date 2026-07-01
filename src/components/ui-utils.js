export function optimizedImageUrl(url, width, format) {
    if (!url || !url.includes('unsplash.com')) return url;
    try {
        const base = url.split('?')[0];
        const params = new URLSearchParams(url.split('?')[1] || '');
        params.set('w', String(width));
        params.set('q', '80');
        params.set('fit', 'clip');
        if (format) params.set('fm', format);
        return `${base}?${params.toString()}`;
    } catch {
        return url;
    }
}

export function responsiveImageHtml(url, alt, className, lazy) {
    if (!url || !url.includes('unsplash.com')) {
        return `<img src="${url || ''}" alt="${escapeHtml(alt || '')}"${className ? ` class="${className}"` : ''}${lazy !== false ? ' loading="lazy" decoding="async"' : ''}>`;
    }
    const base = url.split('?')[0];
    const params = new URLSearchParams(url.split('?')[1] || '');

    const buildUrl = (w, fm) => {
        const p = new URLSearchParams(params);
        p.set('w', String(w));
        p.set('q', '80');
        p.set('fit', 'clip');
        if (fm) p.set('fm', fm);
        return `${base}?${p.toString()}`;
    };

    const fallbackUrl = buildUrl(600, '');
    const webpSrcset = [320, 480, 600, 800, 1200].map(w => `${buildUrl(w, 'webp')} ${w}w`).join(', ');
    const jpgSrcset = [320, 480, 600, 800, 1200].map(w => `${buildUrl(w, '')} ${w}w`).join(', ');

    return `<picture>
        <source type="image/webp" srcset="${webpSrcset}" sizes="(max-width: 600px) 100vw, 600px">
        <source type="image/jpeg" srcset="${jpgSrcset}" sizes="(max-width: 600px) 100vw, 600px">
        <img src="${fallbackUrl}" alt="${escapeHtml(alt || '')}"${className ? ` class="${className}"` : ''}${lazy !== false ? ' loading="lazy" decoding="async"' : ''}>
    </picture>`;
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

const activeToasts = [];

export function showNotification(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `<span class="toast-text">${escapeHtml(message)}</span><div class="toast-progress"></div>`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    closeBtn.onclick = () => dismissToast(toast);
    toast.appendChild(closeBtn);

    container.appendChild(toast);
    activeToasts.push(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    const timer = setTimeout(() => dismissToast(toast), 3500);
    toast._timer = timer;

    toast._progressTimer = setTimeout(() => {
        const bar = toast.querySelector('.toast-progress');
        if (bar) bar.style.width = '0%';
    }, 100);
}

function dismissToast(toast) {
    if (toast._dismissed) return;
    toast._dismissed = true;
    clearTimeout(toast._timer);
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => {
        toast.remove();
        const idx = activeToasts.indexOf(toast);
        if (idx > -1) activeToasts.splice(idx, 1);
    }, 300);
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
    const focusableEls = element.querySelectorAll('a[href]:not([disabled]), button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="email"]:not([disabled]), input[type="password"]:not([disabled]), input[type="tel"]:not([disabled]), input[type="number"]:not([disabled]), input[type="search"]:not([disabled]), input[type="url"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), details > summary:first-child');
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
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusableEl) {
                lastFocusableEl.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusableEl) {
                firstFocusableEl.focus();
                e.preventDefault();
            }
        }
    }, { signal: controller.signal });
}