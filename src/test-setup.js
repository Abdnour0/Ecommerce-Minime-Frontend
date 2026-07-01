import { vi } from 'vitest';

const storage = {};
const localStorageMock = {
  getItem: vi.fn((key) => storage[key] ?? null),
  setItem: vi.fn((key, value) => { storage[key] = String(value); }),
  removeItem: vi.fn((key) => { delete storage[key]; }),
  clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]); }),
  get length() { return Object.keys(storage).length; },
  key: vi.fn((index) => Object.keys(storage)[index] ?? null),
};

vi.stubGlobal('localStorage', localStorageMock);
