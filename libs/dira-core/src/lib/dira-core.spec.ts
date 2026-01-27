import { describe, expect, test } from 'bun:test';
import { DiraController } from './dira-controller';
import { DiraCore } from './dira-core';
import { DiraHttp } from './dira-http';

describe('DiraCore', () => {
  describe('registerHttpHandler', () => {
    test('registers route and handler', () => {
      const dira = new DiraCore();
      const handler = async () => new Response('test');

      dira.registerHttpHandler('/test', handler);

      const routes = dira['routes'];
      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/test');
      expect(routes[0].handler).toBe(handler);
    });

    test('returns this for chaining', () => {
      const dira = new DiraCore();
      const result = dira.registerHttpHandler(
        '/test',
        async () => new Response(),
      );

      expect(result).toBe(dira);
    });
  });

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
  });
});
