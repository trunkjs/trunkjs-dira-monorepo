import { describe, expect, it } from 'bun:test';
import { compileRoute, matchRoute } from './route-matcher';

describe('route-matcher', () => {
  describe('compileRoute', () => {
    it('compiles static routes', () => {
      const compiled = compileRoute('/users');

      expect(compiled.pattern).toBe('/users');
      expect(compiled.paramNames).toEqual([]);
      expect(compiled.regex.source).toBe('^\\/users$');
    });

    it('compiles routes with single parameter', () => {
      const compiled = compileRoute('/users/:id');

      expect(compiled.pattern).toBe('/users/:id');
      expect(compiled.paramNames).toEqual(['id']);
    });

    it('compiles routes with multiple parameters', () => {
      const compiled = compileRoute('/users/:userId/posts/:postId');

      expect(compiled.paramNames).toEqual(['userId', 'postId']);
    });

    it('compiles wildcard routes', () => {
      const compiled = compileRoute('/files/*');

      expect(compiled.paramNames).toEqual(['*']);
    });

    it('escapes regex special characters in static parts', () => {
      const compiled = compileRoute('/api/v1.0/users');

      expect(compiled.regex.test('/api/v1.0/users')).toBe(true);
      expect(compiled.regex.test('/api/v1X0/users')).toBe(false);
    });
  });

  describe('matchRoute', () => {
    describe('static routes', () => {
      it('matches exact pathname', () => {
        const compiled = compileRoute('/users');
        const result = matchRoute(compiled, '/users');

        expect(result.matched).toBe(true);
        if (result.matched) {
          expect(result.params).toEqual({});
        }
      });

      it('does not match different pathname', () => {
        const compiled = compileRoute('/users');

        expect(matchRoute(compiled, '/posts').matched).toBe(false);
        expect(matchRoute(compiled, '/users/123').matched).toBe(false);
        expect(matchRoute(compiled, '/user').matched).toBe(false);
      });

      it('matches root path', () => {
        const compiled = compileRoute('/');
        const result = matchRoute(compiled, '/');

        expect(result.matched).toBe(true);
      });
    });

    describe('parameter routes', () => {
      it('extracts single parameter', () => {
        const compiled = compileRoute('/users/:id');
        const result = matchRoute(compiled, '/users/123');

        expect(result.matched).toBe(true);
        if (result.matched) {
          expect(result.params).toEqual({ id: '123' });
        }
      });

      it('extracts multiple parameters', () => {
        const compiled = compileRoute('/users/:userId/posts/:postId');
        const result = matchRoute(compiled, '/users/42/posts/99');

        expect(result.matched).toBe(true);
        if (result.matched) {
          expect(result.params).toEqual({ userId: '42', postId: '99' });
        }
      });

      it('does not match missing parameter segment', () => {
        const compiled = compileRoute('/users/:id');

        expect(matchRoute(compiled, '/users').matched).toBe(false);
        expect(matchRoute(compiled, '/users/').matched).toBe(false);
      });

      it('does not match extra segments', () => {
        const compiled = compileRoute('/users/:id');

        expect(matchRoute(compiled, '/users/123/extra').matched).toBe(false);
      });

      it('matches parameter with special characters', () => {
        const compiled = compileRoute('/users/:id');
        const result = matchRoute(compiled, '/users/user%40email.com');

        expect(result.matched).toBe(true);
        if (result.matched) {
          expect(result.params.id).toBe('user%40email.com');
        }
      });
    });

    describe('wildcard routes', () => {
      it('captures remainder of path', () => {
        const compiled = compileRoute('/files/*');
        const result = matchRoute(compiled, '/files/path/to/file.txt');

        expect(result.matched).toBe(true);
        if (result.matched) {
          expect(result.params).toEqual({ '*': 'path/to/file.txt' });
        }
      });

      it('captures empty string for trailing wildcard', () => {
        const compiled = compileRoute('/files/*');
        const result = matchRoute(compiled, '/files/');

        expect(result.matched).toBe(true);
        if (result.matched) {
          expect(result.params).toEqual({ '*': '' });
        }
      });

      it('matches wildcard with no trailing content', () => {
        const compiled = compileRoute('/files/*');
        const result = matchRoute(compiled, '/files/');

        expect(result.matched).toBe(true);
      });
    });

    describe('mixed patterns', () => {
      it('combines parameters and static segments', () => {
        const compiled = compileRoute('/api/v1/users/:id/profile');
        const result = matchRoute(compiled, '/api/v1/users/123/profile');

        expect(result.matched).toBe(true);
        if (result.matched) {
          expect(result.params).toEqual({ id: '123' });
        }
      });
    });
  });
});
