import { describe, it, expect, vi, afterEach } from 'vitest';

// config.js reads import.meta.env at module load, so each case resets the
// module registry after stubbing the relevant variable.
async function loadConfig(env = {}) {
  vi.resetModules();
  vi.stubEnv('VITE_STRIPE_PUBLISHABLE_KEY', '');
  Object.entries(env).forEach(([key, value]) => vi.stubEnv(key, value));
  return await import('./config.js');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('STRIPE_ENABLED', () => {
  it('is true when a real publishable key is configured', async () => {
    const config = await loadConfig({ VITE_STRIPE_PUBLISHABLE_KEY: 'pk_live_abc123' });
    expect(config.STRIPE_ENABLED).toBe(true);
  });

  it('is false when the placeholder key is left in place', async () => {
    const config = await loadConfig({
      VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_REPLACE_WITH_YOUR_KEY',
    });
    expect(config.STRIPE_ENABLED).toBe(false);
  });

  it('is false when no key is configured at all', async () => {
    const config = await loadConfig({ VITE_STRIPE_PUBLISHABLE_KEY: '' });
    expect(config.STRIPE_ENABLED).toBe(false);
  });
});
