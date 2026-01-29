import { describe, expect, it } from 'bun:test';
import { UseMiddleware } from './use-middleware';
import {
  getControllerMiddleware,
  getRouteMiddleware,
} from './middleware-storage';
import type { DiraMiddleware } from './middleware-types';

describe('UseMiddleware decorator', () => {
  describe('class decorator (legacy)', () => {
    it('should store middleware on controller', () => {
      const testMiddleware: DiraMiddleware = async (_req, next) => next();

      @UseMiddleware(testMiddleware)
      class TestController {}

      const middleware = getControllerMiddleware(TestController);
      expect(middleware).toHaveLength(1);
      expect(middleware[0].middleware).toBe(testMiddleware);
    });

    it('should store multiple middleware from array', () => {
      const mw1: DiraMiddleware = async (_req, next) => next();
      const mw2: DiraMiddleware = async (_req, next) => next();

      @UseMiddleware([mw1, mw2])
      class TestController {}

      const middleware = getControllerMiddleware(TestController);
      expect(middleware).toHaveLength(2);
    });

    it('should store name option', () => {
      const testMiddleware: DiraMiddleware = async (_req, next) => next();

      @UseMiddleware(testMiddleware, { name: 'test-mw' })
      class TestController {}

      const middleware = getControllerMiddleware(TestController);
      expect(middleware[0].name).toBe('test-mw');
    });

    it('should accumulate middleware from multiple decorators', () => {
      const mw1: DiraMiddleware = async (_req, next) => next();
      const mw2: DiraMiddleware = async (_req, next) => next();

      @UseMiddleware(mw1, { name: 'first' })
      @UseMiddleware(mw2, { name: 'second' })
      class TestController {}

      const middleware = getControllerMiddleware(TestController);
      expect(middleware).toHaveLength(2);
    });
  });

  describe('method decorator (legacy)', () => {
    it('should store middleware on method', () => {
      const testMiddleware: DiraMiddleware = async (_req, next) => next();

      class TestController {
        @UseMiddleware(testMiddleware)
        getData() {
          return {};
        }
      }

      const middleware = getRouteMiddleware(TestController, 'getData');
      expect(middleware).toHaveLength(1);
      expect(middleware[0].middleware).toBe(testMiddleware);
    });

    it('should store multiple middleware from array', () => {
      const mw1: DiraMiddleware = async (_req, next) => next();
      const mw2: DiraMiddleware = async (_req, next) => next();

      class TestController {
        @UseMiddleware([mw1, mw2])
        getData() {
          return {};
        }
      }

      const middleware = getRouteMiddleware(TestController, 'getData');
      expect(middleware).toHaveLength(2);
    });

    it('should store name option', () => {
      const testMiddleware: DiraMiddleware = async (_req, next) => next();

      class TestController {
        @UseMiddleware(testMiddleware, { name: 'route-mw' })
        getData() {
          return {};
        }
      }

      const middleware = getRouteMiddleware(TestController, 'getData');
      expect(middleware[0].name).toBe('route-mw');
    });

    it('should isolate middleware between different methods', () => {
      const mw1: DiraMiddleware = async (_req, next) => next();
      const mw2: DiraMiddleware = async (_req, next) => next();

      class TestController {
        @UseMiddleware(mw1, { name: 'get-mw' })
        getData() {
          return {};
        }

        @UseMiddleware(mw2, { name: 'post-mw' })
        createData() {
          return {};
        }
      }

      const getMiddleware = getRouteMiddleware(TestController, 'getData');
      const postMiddleware = getRouteMiddleware(TestController, 'createData');

      expect(getMiddleware).toHaveLength(1);
      expect(getMiddleware[0].name).toBe('get-mw');
      expect(postMiddleware).toHaveLength(1);
      expect(postMiddleware[0].name).toBe('post-mw');
    });
  });

  describe('property decorator (legacy)', () => {
    it('should store middleware on handler property', () => {
      const testMiddleware: DiraMiddleware = async (_req, next) => next();

      class TestController {
        @UseMiddleware(testMiddleware)
        getData = () => ({});
      }

      const middleware = getRouteMiddleware(TestController, 'getData');
      expect(middleware).toHaveLength(1);
    });
  });

  describe('integration', () => {
    it('should support both class and method middleware on same controller', () => {
      const classMw: DiraMiddleware = async (_req, next) => next();
      const methodMw: DiraMiddleware = async (_req, next) => next();

      @UseMiddleware(classMw, { name: 'class' })
      class TestController {
        @UseMiddleware(methodMw, { name: 'method' })
        getData() {
          return {};
        }

        getOther() {
          return {};
        }
      }

      const classMiddleware = getControllerMiddleware(TestController);
      const methodMiddleware = getRouteMiddleware(TestController, 'getData');
      const otherMiddleware = getRouteMiddleware(TestController, 'getOther');

      expect(classMiddleware).toHaveLength(1);
      expect(classMiddleware[0].name).toBe('class');
      expect(methodMiddleware).toHaveLength(1);
      expect(methodMiddleware[0].name).toBe('method');
      expect(otherMiddleware).toHaveLength(0);
    });
  });
});
