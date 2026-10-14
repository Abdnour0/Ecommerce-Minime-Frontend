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

/**
 * Simulated (mock) card checkout.
 *
 * When enabled, selecting "Credit Card" shows a fake card form and creates an
 * order without contacting a payment provider. Orders created this way are
 * stored with `payment_status = "unpaid"`, but the customer is shown a success
 * screen — so this must NEVER be on in production.
 *
 * Disabled in production builds by default. Enable it explicitly for local
 * development with `VITE_ENABLE_MOCK_PAYMENT=true` (development defaults to on
 * so the storefront is testable without Stripe keys).
 */
export const ENABLE_MOCK_PAYMENT =
    import.meta.env.VITE_ENABLE_MOCK_PAYMENT === 'true' ||
    (import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCK_PAYMENT !== 'false');
