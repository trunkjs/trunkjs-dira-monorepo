import { describe, expect, test } from 'bun:test';
import type { DiraRequest } from './dira-request';
import { DiraController } from './dira-controller';
import { DiraCore } from './dira-core';
import { DiraHttp } from './dira-http';

describe('DiraCore', () => {
  describe('registerController', () => {
    test('registers controller routes with prefix', () => {
      @DiraController('/api')
      class TestController {
        @DiraHttp('/hello')
        async hello() {
          return new Response('hello');
        }
      }

      const dira = new DiraCore();
      dira.registerController(new TestController());

      const routes = dira['routes'];
      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/api/hello');
    });

    test('registers multiple handlers from controller', () => {
      @DiraController('/v1')
      class TestController {
        @DiraHttp('/a')
        async a() {
          return new Response('a');
        }

        @DiraHttp('/b')
        async b() {
          return new Response('b');
        }
      }

      const dira = new DiraCore();
      dira.registerController(new TestController());

      const routes = dira['routes'];
      expect(routes).toHaveLength(2);
      expect(routes.map((r) => r.route)).toEqual(['/v1/a', '/v1/b']);
    });

    test('binds handler to controller instance', async () => {
      @DiraController()
      class TestController {
        private value = 'bound';

        @DiraHttp('/test')
        async test() {
          return new Response(this.value);
        }
      }

      const dira = new DiraCore();
      dira.registerController(new TestController());

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/test'),
      );
      expect(await response.text()).toBe('bound');
    });

    test('returns this for chaining', () => {
      @DiraController()
      class TestController {}

      const dira = new DiraCore();
      const result = dira.registerController(new TestController());

      expect(result).toBe(dira);
    });

    test('wraps controller handlers with DiraRequest and response wrapping', async () => {
      @DiraController('/api')
      class TestController {
        @DiraHttp('/users/:id')
        getUser(req: DiraRequest) {
          return { id: req.params.id };
        }
      }

      const dira = new DiraCore();
      dira.registerController(new TestController());

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/api/users/42'),
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ id: '42' });
    });

    test('returns 204 for void handlers', async () => {
      @DiraController()
      class TestController {
        @DiraHttp('/action')
        doAction() {
          // No return - should result in 204
        }
      }

      const dira = new DiraCore();
      dira.registerController(new TestController());

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/action'),
      );

      expect(response.status).toBe(204);
    });
  });

  describe('registerHandler', () => {
    test('registers route with typed handler', async () => {
      const dira = new DiraCore();

      dira.registerHandler('/users/:id', (req) => {
        return { userId: req.params.id };
      });

      const routes = dira['routes'];
      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/users/:id');
    });

    test('extracts path parameters', async () => {
      const dira = new DiraCore();

      dira.registerHandler('/users/:userId/posts/:postId', (req) => {
        return { userId: req.params.userId, postId: req.params.postId };
      });

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/users/123/posts/456'),
      );

      expect(await response.json()).toEqual({ userId: '123', postId: '456' });
    });

    test('provides query parameters', async () => {
      const dira = new DiraCore();

      dira.registerHandler('/search', (req) => {
        return { query: req.query.q };
      });

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/search?q=test'),
      );

      expect(await response.json()).toEqual({ query: 'test' });
    });

    test('wraps object return as JSON', async () => {
      const dira = new DiraCore();

      dira.registerHandler('/data', () => ({ foo: 'bar' }));

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/data'),
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(await response.json()).toEqual({ foo: 'bar' });
    });

    test('returns explicit Response as-is', async () => {
      const dira = new DiraCore();

      dira.registerHandler('/custom', () => {
        return new Response('custom', { status: 201 });
      });

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/custom'),
      );

      expect(response.status).toBe(201);
      expect(await response.text()).toBe('custom');
    });

    test('returns 204 for null return', async () => {
      const dira = new DiraCore();

      dira.registerHandler('/null', () => null);

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/null'),
      );

      expect(response.status).toBe(204);
    });

    test('returns 204 for void return', async () => {
      const dira = new DiraCore();

      dira.registerHandler('/void', () => {});

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/void'),
      );

      expect(response.status).toBe(204);
    });

    test('handles async handlers', async () => {
      const dira = new DiraCore();

      dira.registerHandler('/async', async () => {
        return { async: true };
      });

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/async'),
      );

      expect(await response.json()).toEqual({ async: true });
    });

    test('returns this for chaining', () => {
      const dira = new DiraCore();
      const result = dira.registerHandler('/test', () => ({}));

      expect(result).toBe(dira);
    });
  });
});
