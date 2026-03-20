import { state } from './state.js';
import { ADMIN_EMAILS } from '../config.js';

export function hasDashboardAccess() {
    return state.currentUser && ADMIN_EMAILS.includes(state.currentUser.email);
}

export function updateDashboardLinkVisibility() {
    const hasAccess = hasDashboardAccess();
    
    // Hide/show dashboard links in navigation
    const navDashboardLink = document.getElementById('navDashboardLink');
    if (navDashboardLink) {
        navDashboardLink.style.display = hasAccess ? '' : 'none';
    }
    
    // Hide/show dashboard links in side menu
    const sideMenuItems = document.querySelectorAll('.side-menu-item[onclick*="showDashboardPage"]');
    sideMenuItems.forEach(link => {
        if (link) {
            link.style.display = hasAccess ? '' : 'none';
        }
    });
    
    // Hide/show dashboard links in account menu
    const accountMenuItems = document.querySelectorAll('.account-menu-item[onclick*="showDashboardPage"]');
    accountMenuItems.forEach(link => {
        if (link) {
            link.style.display = hasAccess ? '' : 'none';
        }
    });
}

