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

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
