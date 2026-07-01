import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  optimizedImageUrl,
  responsiveImageHtml,
  escapeHtml,
  debounce,
  showNotification,
} from './ui-utils.js';

describe('optimizedImageUrl', () => {
  it('returns url unchanged for non-unsplash urls', () => {
    expect(optimizedImageUrl('https://example.com/img.jpg', 600)).toBe('https://example.com/img.jpg');
  });

  it('adds width and quality params to unsplash urls', () => {
    const result = optimizedImageUrl('https://images.unsplash.com/photo-123', 600);
    expect(result).toContain('w=600');
    expect(result).toContain('q=80');
    expect(result).toContain('fit=clip');
  });

  it('preserves existing query params and adds format when specified', () => {
    const result = optimizedImageUrl('https://images.unsplash.com/photo-123?w=200', 600, 'webp');
    expect(result).toContain('fm=webp');
    expect(result).toContain('w=600');
  });

  it('returns empty string for falsy url', () => {
    expect(optimizedImageUrl('', 600)).toBe('');
  });

  it('returns null for null url', () => {
    expect(optimizedImageUrl(null, 600)).toBe(null);
  });
});

describe('responsiveImageHtml', () => {
  it('generates picture element for unsplash urls', () => {
    const html = responsiveImageHtml('https://images.unsplash.com/photo-1', 'Test alt');
    expect(html).toContain('<picture>');
    expect(html).toContain('<source type="image/webp"');
    expect(html).toContain('<source type="image/jpeg"');
    expect(html).toContain('<img src=');
    expect(html).toContain('</picture>');
    expect(html).toContain('Test alt');
  });

  it('includes class name when provided', () => {
    const html = responsiveImageHtml('https://images.unsplash.com/photo-1', '', 'my-class');
    expect(html).toContain('class="my-class"');
  });

  it('sets loading=lazy by default', () => {
    const html = responsiveImageHtml('https://images.unsplash.com/photo-1', '');
    expect(html).toContain('loading="lazy"');
  });

  it('omits loading=lazy when lazy=false', () => {
    const html = responsiveImageHtml('https://images.unsplash.com/photo-1', '', '', false);
    expect(html).not.toContain('loading="lazy"');
  });

  it('falls back to plain img for non-unsplash urls', () => {
    const html = responsiveImageHtml('/local/image.jpg', 'local');
    expect(html).not.toContain('<picture>');
    expect(html).toContain('<img src="/local/image.jpg"');
  });
});

describe('escapeHtml', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('escapes HTML special characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('preserves plain text', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });
});

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('delays function execution', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('cancels previous pending invocation', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced();
    debounced();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledOnce();
  });

  it('passes arguments to the function', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('arg1', 42);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('arg1', 42);
  });
});

describe('showNotification', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="toastContainer"></div>';
  });

  it('appends a toast to the container', () => {
    showNotification('Test message', 'success');
    const container = document.getElementById('toastContainer');
    expect(container.children.length).toBe(1);
    expect(container.querySelector('.toast-text')?.textContent).toBe('Test message');
  });

  it('sets correct type class', () => {
    showNotification('Error!', 'error');
    const toast = document.querySelector('.toast');
    expect(toast.classList.contains('toast-error')).toBe(true);
  });

  it('does nothing if container is missing', () => {
    document.body.innerHTML = '';
    expect(() => showNotification('test', 'success')).not.toThrow();
  });
});
