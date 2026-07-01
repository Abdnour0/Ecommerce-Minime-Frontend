import { describe, it, expect, beforeEach } from 'vitest';
import { RecentlyViewedManager } from './recently-viewed.js';

describe('RecentlyViewedManager', () => {
  beforeEach(() => {
    localStorage.removeItem(RecentlyViewedManager.STORAGE_KEY);
  });

  describe('get', () => {
    it('returns empty array when nothing stored', () => {
      expect(RecentlyViewedManager.get()).toEqual([]);
    });

    it('returns stored items', () => {
      localStorage.setItem(RecentlyViewedManager.STORAGE_KEY, JSON.stringify(['a', 'b']));
      expect(RecentlyViewedManager.get()).toEqual(['a', 'b']);
    });

    it('returns empty array on corrupt JSON', () => {
      localStorage.setItem(RecentlyViewedManager.STORAGE_KEY, '{bad json');
      expect(RecentlyViewedManager.get()).toEqual([]);
    });
  });

  describe('add', () => {
    it('adds item to front of list', () => {
      RecentlyViewedManager.add('item1');
      RecentlyViewedManager.add('item2');
      expect(RecentlyViewedManager.get()).toEqual(['item2', 'item1']);
    });

    it('moves existing item to front', () => {
      RecentlyViewedManager.add('a');
      RecentlyViewedManager.add('b');
      RecentlyViewedManager.add('a');
      expect(RecentlyViewedManager.get()).toEqual(['a', 'b']);
    });

    it('caps list at MAX_ITEMS', () => {
      RecentlyViewedManager.add('1');
      RecentlyViewedManager.add('2');
      RecentlyViewedManager.add('3');
      RecentlyViewedManager.add('4');
      RecentlyViewedManager.add('5');
      expect(RecentlyViewedManager.get()).toEqual(['5', '4', '3', '2']);
      expect(RecentlyViewedManager.get().length).toBe(4);
    });

    it('ignores falsy productId', () => {
      RecentlyViewedManager.add(null);
      expect(RecentlyViewedManager.get()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('removes all items', () => {
      RecentlyViewedManager.add('item');
      RecentlyViewedManager.clear();
      expect(RecentlyViewedManager.get()).toEqual([]);
    });
  });
});
