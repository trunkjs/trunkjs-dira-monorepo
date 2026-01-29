import { describe, expect, test } from 'bun:test';
import { DiraController } from './dira-controller';
import { DiraHttp, getHttpRoutes, ROUTE_FROM_WRAPPER } from './dira-http';

describe('DiraHttp', () => {
  test('stores route metadata on class', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/hello')
      hello() {}
    }

    const routes = getHttpRoutes(new TestController());
    expect(routes).toHaveLength(1);
    expect(routes[0].route).toBe('/hello');
    expect(routes[0].method).toBe('hello');
  });

  test('stores multiple routes', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/one')
      one() {}

      @DiraHttp('/two')
      two() {}
    }

    const routes = getHttpRoutes(new TestController());
    expect(routes).toHaveLength(2);
    expect(routes.map((r) => r.route).sort()).toEqual(['/one', '/two']);
  });

  test('stores single httpMethod as array', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/data', { method: 'POST' })
      create() {}
    }

    const routes = getHttpRoutes(new TestController());
    expect(routes[0].httpMethods).toEqual(['POST']);
  });

  test('stores multiple httpMethods', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/data', { method: ['GET', 'POST'] })
      getData() {}
    }

    const routes = getHttpRoutes(new TestController());
    expect(routes[0].httpMethods).toEqual(['GET', 'POST']);
  });

  test('httpMethods is undefined when not specified', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/data')
      getData() {}
    }

    const routes = getHttpRoutes(new TestController());
    expect(routes[0].httpMethods).toBeUndefined();
  });

  test('accepts options as first argument (for handler())', () => {
    @DiraController()
    class TestController {
      @DiraHttp({ method: 'DELETE' })
      deleteItem() {}
    }

    const routes = getHttpRoutes(new TestController());
    expect(routes[0].httpMethods).toEqual(['DELETE']);
    // Route should be ROUTE_FROM_WRAPPER sentinel (cast as string for storage)
    expect(routes[0].route).toBe(ROUTE_FROM_WRAPPER as unknown as string);
  });

  describe('name option', () => {
    test('stores explicit name in metadata', () => {
      @DiraController()
      class TestController {
        @DiraHttp('/users', { name: 'get-all' })
        getAllUsers() {}
      }

      const routes = getHttpRoutes(new TestController());
      expect(routes[0].name).toBe('get-all');
    });

    test('defaults to method name when name not provided', () => {
      @DiraController()
      class TestController {
        @DiraHttp('/users')
        listUsers() {}
      }

      const routes = getHttpRoutes(new TestController());
      expect(routes[0].name).toBe('listUsers');
    });

    test('accepts hyphenated names', () => {
      @DiraController()
      class TestController {
        @DiraHttp('/users/:id', { name: 'get-by-id' })
        getById() {}
      }

      const routes = getHttpRoutes(new TestController());
      expect(routes[0].name).toBe('get-by-id');
    });

    test('accepts dot-separated names', () => {
      @DiraController()
      class TestController {
        @DiraHttp('/users', { name: 'users.list' })
        list() {}
      }

      const routes = getHttpRoutes(new TestController());
      expect(routes[0].name).toBe('users.list');
    });

    test('accepts name in options-only form', () => {
      @DiraController()
      class TestController {
        @DiraHttp({ method: 'DELETE', name: 'delete-item' })
        deleteItem() {}
      }

      const routes = getHttpRoutes(new TestController());
      expect(routes[0].name).toBe('delete-item');
      expect(routes[0].httpMethods).toEqual(['DELETE']);
    });

    test('throws for invalid name with spaces', () => {
      expect(() => {
        @DiraController()
        class TestController {
          @DiraHttp('/users', { name: 'get all' })
          getAll() {}
        }
      }).toThrow(/Invalid route name/);
    });

    test('throws for invalid name with special characters', () => {
      expect(() => {
        @DiraController()
        class TestController {
          @DiraHttp('/users', { name: 'get!all' })
          getAll() {}
        }
      }).toThrow(/Invalid route name/);
    });
  });
});
