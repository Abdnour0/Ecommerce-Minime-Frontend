import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./logger.js', () => ({
  logger: { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  isDev: () => false,
}));

vi.mock('./state.js', () => ({
  state: { cart: [], products: [], currentUser: null },
}));

vi.mock('./settings.js', () => ({
  SettingsManager: { getTranslation: vi.fn((key) => key) },
}));

vi.mock('./ui-utils.js', () => ({
  showNotification: vi.fn(),
}));

vi.mock('./api-config.js', () => ({
  apiFetch: vi.fn(),
  API_CONFIG: { BASE_URL: 'http://test/api' },
}));

import { CartManager } from './cart.js';
import { state } from './state.js';
import { showNotification } from './ui-utils.js';

describe('CartManager', () => {
  beforeEach(() => {
    localStorage.removeItem('cart');
    state.cart = [];
    state.products = [];
    state.currentUser = null;
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('loads empty cart from localStorage', () => {
      CartManager.init();
      expect(state.cart).toEqual([]);
    });

    it('loads existing cart from localStorage', () => {
      localStorage.setItem('cart', JSON.stringify([{ id: '1', name: 'Test', quantity: 2 }]));
      CartManager.init();
      expect(state.cart).toHaveLength(1);
      expect(state.cart[0].name).toBe('Test');
    });
  });

  describe('add', () => {
    beforeEach(() => {
      CartManager.init();
    });

    it('shows error for missing productId', () => {
      CartManager.add(null);
      expect(showNotification).toHaveBeenCalledWith('Product ID is missing', 'error');
    });

    it('shows error when no products loaded', () => {
      state.products = [];
      CartManager.add('123');
      expect(showNotification).toHaveBeenCalledWith('Products are still loading, please try again', 'error');
    });

    it('shows error when product not found', () => {
      state.products = [{ id: '1', name: 'Shoe', price: 20 }];
      CartManager.add('999');
      expect(showNotification).toHaveBeenCalledWith('Product not found', 'error');
    });

    it('adds new product to cart', () => {
      state.products = [{ id: '1', name: 'Wool Runner', price: 20 }];
      CartManager.add('1');
      expect(state.cart).toHaveLength(1);
      expect(state.cart[0].name).toBe('Wool Runner');
      expect(state.cart[0].quantity).toBe(1);
    });

    it('increments quantity for existing item', () => {
      state.products = [{ id: '1', name: 'Shoe', price: 20 }];
      CartManager.add('1');
      CartManager.add('1');
      expect(state.cart).toHaveLength(1);
      expect(state.cart[0].quantity).toBe(2);
    });
  });

  describe('remove', () => {
    beforeEach(() => {
      CartManager.init();
      state.cart = [{ id: '1', name: 'Test', price: 10, quantity: 1 }];
    });

    it('removes item by id', () => {
      CartManager.remove('1');
      expect(state.cart).toHaveLength(0);
    });

    it('does nothing for non-existent id', () => {
      CartManager.remove('999');
      expect(state.cart).toHaveLength(1);
    });
  });

  describe('updateQuantity', () => {
    beforeEach(() => {
      CartManager.init();
      state.cart = [{ id: '1', name: 'Test', price: 10, quantity: 3 }];
    });

    it('increases quantity', () => {
      CartManager.updateQuantity('1', 1);
      expect(state.cart[0].quantity).toBe(4);
    });

    it('decreases quantity', () => {
      CartManager.updateQuantity('1', -1);
      expect(state.cart[0].quantity).toBe(2);
    });

    it('removes item when quantity reaches 0', () => {
      CartManager.updateQuantity('1', -3);
      expect(state.cart).toHaveLength(0);
    });
  });

  describe('save', () => {
    it('persists cart to localStorage', () => {
      state.cart = [{ id: '1', name: 'Test', price: 10, quantity: 1 }];
      CartManager.save();
      const stored = JSON.parse(localStorage.getItem('cart'));
      expect(stored).toHaveLength(1);
      expect(stored[0].name).toBe('Test');
    });
  });

  describe('getTotal', () => {
    it('calculates total with quantities', () => {
      state.cart = [
        { id: '1', price: 10, quantity: 2 },
        { id: '2', price: 5, quantity: 3 },
      ];
      expect(CartManager.getTotal()).toBe(35);
    });

    it('returns 0 for empty cart', () => {
      state.cart = [];
      expect(CartManager.getTotal()).toBe(0);
    });
  });

  describe('getItemCount', () => {
    it('sums quantities', () => {
      state.cart = [
        { id: '1', quantity: 2 },
        { id: '2', quantity: 1 },
      ];
      expect(CartManager.getItemCount()).toBe(3);
    });

    it('returns 0 for empty cart', () => {
      state.cart = [];
      expect(CartManager.getItemCount()).toBe(0);
    });
  });

  describe('clear', () => {
    it('empties cart', () => {
      state.cart = [{ id: '1', name: 'Test', price: 10, quantity: 1 }];
      CartManager.clear();
      expect(state.cart).toEqual([]);
    });
  });

  describe('syncToServer', () => {
    beforeEach(() => {
      CartManager._syncTimeout = null;
    });

    it('skips sync when user is not logged in', () => {
      state.currentUser = null;
      state.cart = [{ id: '1', quantity: 1 }];
      CartManager.syncToServer();
      expect(CartManager._syncTimeout).toBeNull();
    });

    it('skips sync when cart is empty', () => {
      state.currentUser = { id: '1' };
      state.cart = [];
      CartManager.syncToServer();
      expect(CartManager._syncTimeout).toBeNull();
    });
  });
});
