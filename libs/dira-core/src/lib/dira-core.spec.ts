import { describe, expect, test } from 'bun:test';
import type { DiraRequest } from './dira-request';
import { DiraController } from './dira-controller';
import { DiraCore } from './dira-core';
import { DiraHttp } from './dira-http';
import { handler } from './handler';

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

    test('supports handler() wrapper with @DiraHttp()', async () => {
      @DiraController('/api')
      class TestController {
        @DiraHttp()
        getUser = handler('/:id', (req) => {
          return { userId: req.params.id };
        });
      }

      const dira = new DiraCore();
      dira.registerController(new TestController());

      const routes = dira['routes'];
      expect(routes).toHaveLength(1);
      expect(routes[0].route).toBe('/api/:id');

      const response = await routes[0].handler(
        new Request('http://localhost/api/123'),
      );
      expect(await response.json()).toEqual({ userId: '123' });
    });

    test('supports handler() with multiple path params', async () => {
      @DiraController('/users')
      class TestController {
        @DiraHttp()
        getPost = handler('/:userId/posts/:postId', (req) => {
          return {
            userId: req.params.userId,
            postId: req.params.postId,
          };
        });
      }

      const dira = new DiraCore();
      dira.registerController(new TestController());

      const response = await dira['routes'][0].handler(
        new Request('http://localhost/users/42/posts/99'),
      );
      expect(await response.json()).toEqual({ userId: '42', postId: '99' });
    });

    test('supports mixing handler() and explicit @DiraHttp(route)', async () => {
      @DiraController('/api')
      class TestController {
        @DiraHttp('/explicit')
        explicit() {
          return { type: 'explicit' };
        }

        @DiraHttp()
        wrapped = handler('/wrapped/:id', (req) => {
          return { type: 'wrapped', id: req.params.id };
        });
      }

      const dira = new DiraCore();
      dira.registerController(new TestController());

      const routes = dira['routes'];
      expect(routes).toHaveLength(2);
      expect(routes[0].route).toBe('/api/explicit');
      expect(routes[1].route).toBe('/api/wrapped/:id');
    });

    test('throws error when @DiraHttp() used without handler()', () => {
      @DiraController()
      class TestController {
        @DiraHttp()
        invalid() {
          return {};
        }
      }

      const dira = new DiraCore();
      expect(() => dira.registerController(new TestController())).toThrow(
        /@DiraHttp\(\) on "invalid" requires handler\(\) wrapper/,
      );
    });

    describe('route names', () => {
      test('builds full name from controller and method names', () => {
        @DiraController('/api', { name: 'api' })
        class TestController {
          @DiraHttp('/users', { name: 'get-users' })
          getUsers() {
            return [];
          }
        }

        const dira = new DiraCore();
        dira.registerController(new TestController());

        const routes = dira['routes'];
        expect(routes[0].name).toBe('api.get-users');
      });

      test('uses class name as fallback for controller name', () => {
        @DiraController('/api')
        class UsersController {
          @DiraHttp('/list', { name: 'list' })
          list() {
            return [];
          }
        }

        const dira = new DiraCore();
        dira.registerController(new UsersController());

        const routes = dira['routes'];
        expect(routes[0].name).toBe('UsersController.list');
      });

      test('uses method name as fallback for route name', () => {
        @DiraController('/api', { name: 'api' })
        class TestController {
          @DiraHttp('/users')
          getAllUsers() {
            return [];
          }
        }

        const dira = new DiraCore();
        dira.registerController(new TestController());

        const routes = dira['routes'];
        expect(routes[0].name).toBe('api.getAllUsers');
      });

      test('uses both fallbacks when no names specified', () => {
        @DiraController('/api')
        class MyController {
          @DiraHttp('/data')
          fetchData() {
            return {};
          }
        }

        const dira = new DiraCore();
        dira.registerController(new MyController());

        const routes = dira['routes'];
        expect(routes[0].name).toBe('MyController.fetchData');
      });

      test('works with handler() wrapper', () => {
        @DiraController('/api', { name: 'api' })
        class TestController {
          @DiraHttp({ name: 'get-by-id' })
          getUser = handler('/:id', (req) => {
            return { id: req.params.id };
          });
        }

        const dira = new DiraCore();
        dira.registerController(new TestController());

        const routes = dira['routes'];
        expect(routes[0].name).toBe('api.get-by-id');
      });

      test('throws on duplicate explicit names within same controller', () => {
        @DiraController('/api', { name: 'api' })
        class TestController {
          @DiraHttp('/users', { name: 'list' })
          listUsers() {
            return [];
          }

          @DiraHttp('/posts', { name: 'list' })
          listPosts() {
            return [];
          }
        }

        const dira = new DiraCore();
        expect(() => dira.registerController(new TestController())).toThrow(
          /Duplicate route name "api\.list"/,
        );
      });

      test('throws on duplicate implicit names (same method name)', () => {
        @DiraController('/api', { name: 'api' })
        class Controller1 {
          @DiraHttp('/users')
          list() {
            return [];
          }
        }

        @DiraController('/admin', { name: 'api' })
        class Controller2 {
          @DiraHttp('/posts')
          list() {
            return [];
          }
        }

        const dira = new DiraCore();
        dira.registerController(new Controller1());
        expect(() => dira.registerController(new Controller2())).toThrow(
          /Duplicate route name "api\.list"/,
        );
      });

      test('throws on duplicate names across controllers', () => {
        @DiraController('/api', { name: 'shared' })
        class Controller1 {
          @DiraHttp('/endpoint1', { name: 'action' })
          action1() {
            return {};
          }
        }

        @DiraController('/admin', { name: 'shared' })
        class Controller2 {
          @DiraHttp('/endpoint2', { name: 'action' })
          action2() {
            return {};
          }
        }

        const dira = new DiraCore();
        dira.registerController(new Controller1());
        expect(() => dira.registerController(new Controller2())).toThrow(
          /Duplicate route name "shared\.action"/,
        );
      });

      test('allows same method name with different controller names', () => {
        @DiraController('/api', { name: 'users' })
        class UsersController {
          @DiraHttp('/list')
          list() {
            return [];
          }
        }

        @DiraController('/api', { name: 'posts' })
        class PostsController {
          @DiraHttp('/list')
          list() {
            return [];
          }
        }

        const dira = new DiraCore();
        dira.registerController(new UsersController());
        dira.registerController(new PostsController());

        const routes = dira['routes'];
        expect(routes[0].name).toBe('users.list');
        expect(routes[1].name).toBe('posts.list');
      });
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

    test('stores name when provided', () => {
      const dira = new DiraCore();
      dira.registerHandler('/users', () => [], { name: 'api.users.list' });

      const routes = dira['routes'];
      expect(routes[0].name).toBe('api.users.list');
    });

    test('name is undefined when not provided', () => {
      const dira = new DiraCore();
      dira.registerHandler('/users', () => []);

      const routes = dira['routes'];
      expect(routes[0].name).toBeUndefined();
    });

    test('throws on duplicate names', () => {
      const dira = new DiraCore();
      dira.registerHandler('/users', () => [], { name: 'api.users' });

      expect(() =>
        dira.registerHandler('/other', () => [], { name: 'api.users' }),
      ).toThrow(/Duplicate route name "api\.users"/);
    });

    test('allows duplicate routes without names', () => {
      const dira = new DiraCore();
      dira.registerHandler('/users', () => []);
      dira.registerHandler('/other', () => []);

      const routes = dira['routes'];
      expect(routes).toHaveLength(2);
    });

    test('throws on duplicate name between handler and controller', () => {
      @DiraController('/api', { name: 'api' })
      class TestController {
        @DiraHttp('/users', { name: 'list' })
        list() {
          return [];
        }
      }

      const dira = new DiraCore();
      dira.registerHandler('/imperative', () => [], { name: 'api.list' });

      expect(() => dira.registerController(new TestController())).toThrow(
        /Duplicate route name "api\.list"/,
      );
    });
  });
});
