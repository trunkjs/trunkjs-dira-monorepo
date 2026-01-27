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

  test('stores httpMethod option', () => {
    @DiraController()
    class TestController {
      @DiraHttp('/data', { method: 'POST' })
      create() {}
    }

    const routes: ControllerMetadata[] = Reflect.getMetadata(
      HTTP_ROUTES,
      TestController,
    );
    expect(routes[0].httpMethod).toBe('POST');
  });
});
