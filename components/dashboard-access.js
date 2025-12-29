import { state } from './state.js';

export const ALLOWED_DASHBOARD_EMAIL = 'abdnourguellaa50@gmail.com';

export function hasDashboardAccess() {
    return state.currentUser && state.currentUser.email === ALLOWED_DASHBOARD_EMAIL;
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

