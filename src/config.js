// ============================================================================
// APP CONFIGURATION
// To customise for your environment, edit the values below.
// In production, replace these with your real keys before deploying.
// ============================================================================

/**
 * Base URL for all API calls.
 * Change to your production backend URL before deploying.
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

/**
 * Stripe publishable key.
 * Replace with your real Stripe publishable key (starts with pk_live_ or pk_test_).
 * NEVER use the secret key here.
 */
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_REPLACE_WITH_YOUR_KEY';

/**
 * Admin email addresses that are granted dashboard access.
 * Add additional emails separated by commas.
 */
export const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').filter(Boolean);
