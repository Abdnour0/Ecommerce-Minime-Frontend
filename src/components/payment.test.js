import { describe, it, expect } from 'vitest';
import { resolveCardPaymentMode } from './payment.js';

describe('resolveCardPaymentMode', () => {
  it('uses Stripe when a real instance is available', () => {
    expect(resolveCardPaymentMode({ stripeReady: true, mockEnabled: false })).toBe('stripe');
    expect(resolveCardPaymentMode({ stripeReady: true, mockEnabled: true })).toBe('stripe');
  });

  it('falls back to the mock checkout only when it is explicitly enabled', () => {
    expect(resolveCardPaymentMode({ stripeReady: false, mockEnabled: true })).toBe('mock');
  });

  it('refuses card payments when Stripe is absent and the mock is disabled (production)', () => {
    expect(resolveCardPaymentMode({ stripeReady: false, mockEnabled: false })).toBe('unavailable');
  });

  it('falls back to the configured default when mockEnabled is not passed', () => {
    // Development builds (import.meta.env.DEV) default the mock on; production
    // builds default it off, so card payments are refused.
    const expected = import.meta.env.DEV ? 'mock' : 'unavailable';
    expect(resolveCardPaymentMode({ stripeReady: false })).toBe(expected);
  });
});
