import { describe, expect, it } from 'bun:test';
import {
  getControllerMiddleware,
  getRouteMiddleware,
  setControllerMiddleware,
  setRouteMiddleware,
} from './middleware-storage';
import type { MiddlewareDescriptor } from './middleware-types';

describe('setControllerMiddleware / getControllerMiddleware', () => {
  it('should store and retrieve controller middleware', () => {
    class TestController {}
    const middleware: MiddlewareDescriptor[] = [
      { middleware: async (_req, next) => next() },
    ];

    setControllerMiddleware(TestController, middleware);
    const result = getControllerMiddleware(TestController);

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(middleware[0]);
  });

  it('should return empty array for unregistered controllers', () => {
    class UnregisteredController {}
    expect(getControllerMiddleware(UnregisteredController)).toEqual([]);
  });

  it('should accumulate middleware when called multiple times', () => {
    class TestController2 {}
    const mw1: MiddlewareDescriptor = {
      middleware: async (_req, next) => next(),
    };
    const mw2: MiddlewareDescriptor = {
      middleware: async (_req, next) => next(),
    };

    setControllerMiddleware(TestController2, [mw1]);
    setControllerMiddleware(TestController2, [mw2]);

    const result = getControllerMiddleware(TestController2);
    expect(result).toHaveLength(2);
  });

  it('should isolate middleware between different controllers', () => {
    class ControllerA {}
    class ControllerB {}
    const mwA: MiddlewareDescriptor = {
      middleware: async (_req, next) => next(),
      name: 'A',
    };
    const mwB: MiddlewareDescriptor = {
      middleware: async (_req, next) => next(),
      name: 'B',
    };

    setControllerMiddleware(ControllerA, [mwA]);
    setControllerMiddleware(ControllerB, [mwB]);

    expect(getControllerMiddleware(ControllerA)).toHaveLength(1);
    expect(getControllerMiddleware(ControllerA)[0].name).toBe('A');
    expect(getControllerMiddleware(ControllerB)).toHaveLength(1);
    expect(getControllerMiddleware(ControllerB)[0].name).toBe('B');
  });
});

describe('setRouteMiddleware / getRouteMiddleware', () => {
  it('should store and retrieve route middleware', () => {
    class TestController {}
    const middleware: MiddlewareDescriptor[] = [
      { middleware: async (_req, next) => next() },
    ];

    setRouteMiddleware(TestController, 'getUser', middleware);
    const result = getRouteMiddleware(TestController, 'getUser');

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(middleware[0]);
  });

  it('should return empty array for unregistered routes', () => {
    class TestController {}
    expect(getRouteMiddleware(TestController, 'unregistered')).toEqual([]);
  });

  it('should return empty array for unregistered controllers', () => {
    class UnregisteredController {}
    expect(getRouteMiddleware(UnregisteredController, 'anyMethod')).toEqual([]);
  });

  it('should accumulate middleware when called multiple times', () => {
    class TestController3 {}
    const mw1: MiddlewareDescriptor = {
      middleware: async (_req, next) => next(),
    };
    const mw2: MiddlewareDescriptor = {
      middleware: async (_req, next) => next(),
    };

    setRouteMiddleware(TestController3, 'getData', [mw1]);
    setRouteMiddleware(TestController3, 'getData', [mw2]);

    const result = getRouteMiddleware(TestController3, 'getData');
    expect(result).toHaveLength(2);
  });

  it('should isolate middleware between different methods', () => {
    class TestController4 {}
    const mw1: MiddlewareDescriptor = {
      middleware: async (_req, next) => next(),
      name: 'get',
    };
    const mw2: MiddlewareDescriptor = {
      middleware: async (_req, next) => next(),
      name: 'post',
    };

    setRouteMiddleware(TestController4, 'getUser', [mw1]);
    setRouteMiddleware(TestController4, 'createUser', [mw2]);

    expect(getRouteMiddleware(TestController4, 'getUser')[0].name).toBe('get');
    expect(getRouteMiddleware(TestController4, 'createUser')[0].name).toBe(
      'post',
    );
  });

  it('should support symbol method names', () => {
    class TestController {}
    const methodSymbol = Symbol('getData');
    const middleware: MiddlewareDescriptor[] = [
      { middleware: async (_req, next) => next() },
    ];

    setRouteMiddleware(TestController, methodSymbol, middleware);
    const result = getRouteMiddleware(TestController, methodSymbol);

    expect(result).toHaveLength(1);
  });
});
