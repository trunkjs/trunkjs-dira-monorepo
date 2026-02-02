import { describe, expect, it } from 'bun:test';
import { getMimeType } from './mime-types';

describe('getMimeType', () => {
  describe('default MIME types', () => {
    it('returns text/html for .html', () => {
      expect(getMimeType('/path/file.html')).toBe('text/html; charset=utf-8');
    });

    it('returns text/html for .htm', () => {
      expect(getMimeType('/path/file.htm')).toBe('text/html; charset=utf-8');
    });

    it('returns text/css for .css', () => {
      expect(getMimeType('/path/style.css')).toBe('text/css; charset=utf-8');
    });

    it('returns text/javascript for .js', () => {
      expect(getMimeType('/path/script.js')).toBe(
        'text/javascript; charset=utf-8',
      );
    });

    it('returns application/json for .json', () => {
      expect(getMimeType('/path/data.json')).toBe(
        'application/json; charset=utf-8',
      );
    });

    it('returns image/png for .png', () => {
      expect(getMimeType('/path/image.png')).toBe('image/png');
    });

    it('returns image/jpeg for .jpg', () => {
      expect(getMimeType('/path/image.jpg')).toBe('image/jpeg');
    });

    it('returns image/svg+xml for .svg', () => {
      expect(getMimeType('/path/icon.svg')).toBe('image/svg+xml');
    });

    it('returns font/woff2 for .woff2', () => {
      expect(getMimeType('/path/font.woff2')).toBe('font/woff2');
    });

    it('returns application/wasm for .wasm', () => {
      expect(getMimeType('/path/module.wasm')).toBe('application/wasm');
    });

    it('returns application/pdf for .pdf', () => {
      expect(getMimeType('/path/doc.pdf')).toBe('application/pdf');
    });
  });

  describe('case insensitivity', () => {
    it('handles uppercase extensions', () => {
      expect(getMimeType('/path/FILE.HTML')).toBe('text/html; charset=utf-8');
    });

    it('handles mixed case extensions', () => {
      expect(getMimeType('/path/file.JsOn')).toBe(
        'application/json; charset=utf-8',
      );
    });
  });

  describe('unknown types', () => {
    it('returns application/octet-stream for unknown extension', () => {
      expect(getMimeType('/path/file.xyz')).toBe('application/octet-stream');
    });

    it('returns application/octet-stream for no extension', () => {
      expect(getMimeType('/path/Makefile')).toBe('application/octet-stream');
    });
  });

  describe('custom MIME types', () => {
    it('uses custom type override', () => {
      const customTypes = { '.xyz': 'application/x-custom' };
      expect(getMimeType('/path/file.xyz', customTypes)).toBe(
        'application/x-custom',
      );
    });

    it('custom type takes precedence over default', () => {
      const customTypes = { '.html': 'text/plain' };
      expect(getMimeType('/path/file.html', customTypes)).toBe('text/plain');
    });

    it('falls back to default if not in custom', () => {
      const customTypes = { '.xyz': 'application/x-custom' };
      expect(getMimeType('/path/file.html', customTypes)).toBe(
        'text/html; charset=utf-8',
      );
    });
  });
});
