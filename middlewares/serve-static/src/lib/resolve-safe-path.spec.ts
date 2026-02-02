import { describe, expect, it } from 'bun:test';
import { resolve, sep } from 'node:path';
import { resolveSafePath } from './resolve-safe-path';

describe('resolveSafePath', () => {
  const root = resolve('/var/www/public');

  describe('valid paths', () => {
    it('resolves simple path', () => {
      const result = resolveSafePath(root, '/file.txt');
      expect(result).toBe(resolve(root, 'file.txt'));
    });

    it('resolves nested path', () => {
      const result = resolveSafePath(root, '/assets/css/style.css');
      expect(result).toBe(resolve(root, 'assets/css/style.css'));
    });

    it('resolves root path', () => {
      const result = resolveSafePath(root, '/');
      expect(result).toBe(root);
    });

    it('resolves path with leading dots in filename', () => {
      const result = resolveSafePath(root, '/.htaccess');
      expect(result).toBe(resolve(root, '.htaccess'));
    });

    it('resolves path with multiple extensions', () => {
      const result = resolveSafePath(root, '/file.tar.gz');
      expect(result).toBe(resolve(root, 'file.tar.gz'));
    });
  });

  describe('path traversal prevention', () => {
    it('blocks simple traversal', () => {
      const result = resolveSafePath(root, '/../etc/passwd');
      expect(result).toBeNull();
    });

    it('blocks double traversal', () => {
      const result = resolveSafePath(root, '/../../etc/passwd');
      expect(result).toBeNull();
    });

    it('blocks traversal in middle of path', () => {
      const result = resolveSafePath(root, '/assets/../../../etc/passwd');
      expect(result).toBeNull();
    });

    it('blocks encoded traversal (%2e%2e)', () => {
      const result = resolveSafePath(root, '/%2e%2e/etc/passwd');
      expect(result).toBeNull();
    });

    it('allows double-encoded as literal (no traversal)', () => {
      const result = resolveSafePath(root, '/%252e%252e/etc/passwd');
      // %252e decodes to %2e which is a literal directory name, not traversal
      // This is correct - we only decode once, so %2e%2e stays as a literal
      expect(result).toBe(resolve(root, '%2e%2e/etc/passwd'));
    });

    it('blocks null byte injection', () => {
      const result = resolveSafePath(root, '/file.txt\0.jpg');
      expect(result).toBeNull();
    });

    it('blocks encoded null byte', () => {
      const result = resolveSafePath(root, '/file.txt%00.jpg');
      expect(result).toBeNull();
    });

    it('allows safe . in path (current dir)', () => {
      const result = resolveSafePath(root, '/./file.txt');
      expect(result).toBe(resolve(root, 'file.txt'));
    });

    it('allows .. that stays within root', () => {
      const result = resolveSafePath(root, '/assets/../file.txt');
      expect(result).toBe(resolve(root, 'file.txt'));
    });
  });

  describe('edge cases', () => {
    it('handles invalid URI encoding', () => {
      const result = resolveSafePath(root, '/%ZZ');
      expect(result).toBeNull();
    });

    it('handles path with spaces', () => {
      const result = resolveSafePath(root, '/my%20file.txt');
      expect(result).toBe(resolve(root, 'my file.txt'));
    });

    it('handles path with unicode', () => {
      const result = resolveSafePath(root, '/文件.txt');
      expect(result).toBe(resolve(root, '文件.txt'));
    });
  });
});
