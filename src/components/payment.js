import { ENABLE_MOCK_PAYMENT } from '../config.js';

/**
 * Decide how a card payment should be handled.
 *
 * - `'stripe'`      a real Stripe instance is available and should be used
 * - `'mock'`        simulate the payment locally (development only)
 * - `'unavailable'` card payments cannot be processed at all
 *
 * @param {object}  options
 * @param {boolean} options.stripeReady  whether a real Stripe instance is loaded
 * @param {boolean} [options.mockEnabled] override for the simulated checkout flag
 * @returns {'stripe' | 'mock' | 'unavailable'}
 */
export function resolveCardPaymentMode({ stripeReady, mockEnabled = ENABLE_MOCK_PAYMENT } = {}) {
    if (stripeReady) return 'stripe';
    return mockEnabled ? 'mock' : 'unavailable';
}
