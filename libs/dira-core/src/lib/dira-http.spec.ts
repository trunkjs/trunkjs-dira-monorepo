import { describe, expect, test } from 'bun:test';
import type { ControllerMetadata } from './controller-metadata';
import { DiraController } from './dira-controller';
import { DiraHttp, HTTP_ROUTES } from './dira-http';

describe('DiraHttp', () => {
  test('stores route metadata on class', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/hello')
      hello() {}
    }

    const routes: ControllerMetadata[] = Reflect.getMetadata(
      HTTP_ROUTES,
      TestController,
    );
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

    const routes: ControllerMetadata[] = Reflect.getMetadata(
      HTTP_ROUTES,
      TestController,
    );
    expect(routes).toHaveLength(2);
    expect(routes.map((r) => r.route)).toEqual(['/one', '/two']);
  });

  test('stores single httpMethod as array', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/data', { method: 'POST' })
      create() {}
    }

    const routes: ControllerMetadata[] = Reflect.getMetadata(
      HTTP_ROUTES,
      TestController,
    );
    expect(routes[0].httpMethods).toEqual(['POST']);
  });

  test('stores multiple httpMethods', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/data', { method: ['GET', 'POST'] })
      getData() {}
    }

    const routes: ControllerMetadata[] = Reflect.getMetadata(
      HTTP_ROUTES,
      TestController,
    );
    expect(routes[0].httpMethods).toEqual(['GET', 'POST']);
  });

  test('httpMethods is undefined when not specified', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/data')
      getData() {}
    }

    const routes: ControllerMetadata[] = Reflect.getMetadata(
      HTTP_ROUTES,
      TestController,
    );
    expect(routes[0].httpMethods).toBeUndefined();
  });

  test('accepts options as first argument (for handler())', () => {
    @DiraController()
    class TestController {
      @DiraHttp({ method: 'DELETE' })
      deleteItem() {}
    }

    const routes: ControllerMetadata[] = Reflect.getMetadata(
      HTTP_ROUTES,
      TestController,
    );
    expect(routes[0].httpMethods).toEqual(['DELETE']);
    // Route should be ROUTE_FROM_HANDLER symbol (cast as string for storage)
    expect(typeof routes[0].route).toBe('symbol');
  });
});
