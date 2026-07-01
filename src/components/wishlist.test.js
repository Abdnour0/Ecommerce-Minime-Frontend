import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./logger.js', () => ({
  logger: { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  isDev: () => false,
}));

vi.mock('./state.js', () => ({
  state: { wishlist: [], products: [] },
}));

vi.mock('./ui-utils.js', () => ({
  showNotification: vi.fn(),
  escapeHtml: (s) => s,
}));

vi.mock('./settings.js', () => ({
  SettingsManager: { getTranslation: vi.fn((key) => key) },
}));

vi.mock('./cart.js', () => ({
  CartManager: { add: vi.fn() },
}));

vi.mock('./products.js', () => ({
  openProductModal: vi.fn(),
}));

import { WishlistManager } from './wishlist.js';
import { state } from './state.js';
import { showNotification } from './ui-utils.js';

describe('WishlistManager', () => {
  beforeEach(() => {
    localStorage.removeItem('wishlist');
    state.wishlist = [];
    state.products = [];
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('initializes empty wishlist', () => {
      WishlistManager.init();
      expect(state.wishlist).toEqual([]);
    });

    it('loads wishlist from localStorage', () => {
      localStorage.setItem('wishlist', JSON.stringify(['1', '2']));
      WishlistManager.init();
      expect(state.wishlist).toEqual(['1', '2']);
    });

    it('deduplicates IDs on load', () => {
      localStorage.setItem('wishlist', JSON.stringify(['1', '1', '2']));
      WishlistManager.init();
      expect(state.wishlist).toEqual(['1', '2']);
    });
  });

  describe('toggle', () => {
    beforeEach(() => {
      WishlistManager.init();
      Object.assign(WishlistManager, { save: vi.fn(), updateCounter: vi.fn() });
    });

    it('adds item to wishlist', () => {
      WishlistManager.toggle('1');
      expect(state.wishlist).toContain('1');
      expect(showNotification).toHaveBeenCalledWith('Added to wishlist!', 'success');
    });

    it('removes item from wishlist', () => {
      WishlistManager.toggle('1');
      WishlistManager.toggle('1');
      expect(state.wishlist).not.toContain('1');
      expect(showNotification).toHaveBeenCalledWith('Removed from wishlist', 'info');
    });
  });

  describe('isInWishlist', () => {
    it('returns true when item is in wishlist', () => {
      state.wishlist = ['1'];
      expect(WishlistManager.isInWishlist('1')).toBe(true);
    });

    it('returns false when item is not in wishlist', () => {
      state.wishlist = ['2'];
      expect(WishlistManager.isInWishlist('1')).toBe(false);
    });

    it('handles type coercion', () => {
      state.wishlist = ['1'];
      expect(WishlistManager.isInWishlist(1)).toBe(true);
    });
  });

  describe('getProducts', () => {
    it('filters products by wishlist IDs', () => {
      state.wishlist = ['1', '3'];
      const products = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' },
      ];
      const result = WishlistManager.getProducts(products);
      expect(result).toHaveLength(2);
      expect(result.map(p => p.name)).toEqual(['A', 'C']);
    });
  });

  describe('cleanup', () => {
    it('removes invalid wishlist items', () => {
      state.wishlist = ['1', '2', '3'];
      state.products = [{ id: '1' }, { id: '3' }];
      Object.assign(WishlistManager, { save: vi.fn(), updateCounter: vi.fn() });
      WishlistManager.cleanup();
      expect(state.wishlist).toEqual(['1', '3']);
    });
  });
});
