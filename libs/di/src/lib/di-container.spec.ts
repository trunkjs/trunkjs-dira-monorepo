import { describe, expect, it } from 'bun:test';

import { DiContainer } from './di-container';
import { Inject } from './inject';
import { Injectable } from './injectable';

/** Minimal concrete container for testing base class behavior */
class EmptyContainer extends DiContainer {}

describe('DiContainer', () => {
  describe('has()', () => {
    it('returns true for existing properties', () => {
      class TestContainer extends DiContainer {
        get logger() {
          return 'mock-logger';
        }
      }

      const container = new TestContainer();
      expect(container.has('logger')).toBe(true);
    });

    it('returns false for non-existing properties', () => {
      const container = new EmptyContainer();
      expect(container.has('nonexistent')).toBe(false);
    });
  });

  describe('resolve()', () => {
    it('resolves existing dependencies', () => {
      class TestContainer extends DiContainer {
        get config() {
          return { apiUrl: 'https://api.example.com' };
        }
      }

      const container = new TestContainer();
      const config = container.resolve<{ apiUrl: string }>('config');
      expect(config.apiUrl).toBe('https://api.example.com');
    });

    it('throws for non-existing dependencies', () => {
      const container = new EmptyContainer();
      expect(() => container.resolve('nonexistent')).toThrow(
        'No provider for token: nonexistent',
      );
    });

    it('resolves methods as dependencies', () => {
      class TestContainer extends DiContainer {
        getMessage() {
          return 'hello';
        }
      }

      const container = new TestContainer();
      const getMessage = container.resolve<() => string>('getMessage');
      expect(typeof getMessage).toBe('function');
    });
  });

  describe('newInstanceOf()', () => {
    it('creates instances of plain classes', () => {
      class SimpleClass {
        value = 42;
      }

      const container = new EmptyContainer();
      const instance = container.newInstanceOf(SimpleClass);

      expect(instance).toBeInstanceOf(SimpleClass);
      expect(instance.value).toBe(42);
    });

    it('injects properties for @Injectable classes', () => {
      const mockLogger = { log: () => {} };

      class TestContainer extends DiContainer {
        get logger() {
          return mockLogger;
        }
      }

      @Injectable()
      class Service {
        @Inject('logger') logger!: { log: () => void };
      }

      const container = new TestContainer();
      const service = container.newInstanceOf(Service);

      expect(service.logger).toBe(mockLogger);
    });

    it('returns cached instance for singleton-scoped injectables', () => {
      @Injectable({ scope: 'singleton' })
      class SingletonService {
        id = Math.random();
      }

      const container = new EmptyContainer();
      const first = container.newInstanceOf(SingletonService);
      const second = container.newInstanceOf(SingletonService);

      expect(first).toBe(second);
      expect(first.id).toBe(second.id);
    });

    it('creates new instances for transient-scoped injectables', () => {
      @Injectable({ scope: 'transient' })
      class TransientService {
        id = Math.random();
      }

      const container = new EmptyContainer();
      const first = container.newInstanceOf(TransientService);
      const second = container.newInstanceOf(TransientService);

      expect(first).not.toBe(second);
      expect(first.id).not.toBe(second.id);
    });

    it('creates new instances for default-scoped injectables', () => {
      @Injectable()
      class DefaultService {
        id = Math.random();
      }

      const container = new EmptyContainer();
      const first = container.newInstanceOf(DefaultService);
      const second = container.newInstanceOf(DefaultService);

      expect(first).not.toBe(second);
    });

    it('throws when dependency cannot be resolved', () => {
      @Injectable()
      class BrokenService {
        @Inject('nonexistent') dep!: unknown;
      }

      const container = new EmptyContainer();
      expect(() => container.newInstanceOf(BrokenService)).toThrow(
        'No provider for token: nonexistent',
      );
    });

    it('supports multiple injected properties', () => {
      class TestContainer extends DiContainer {
        get logger() {
          return 'mock-logger';
        }
        get config() {
          return { debug: true };
        }
      }

      @Injectable()
      class MultiPropService {
        @Inject('logger') logger!: string;
        @Inject('config') config!: { debug: boolean };
      }

      const container = new TestContainer();
      const service = container.newInstanceOf(MultiPropService);

      expect(service.logger).toBe('mock-logger');
      expect(service.config).toEqual({ debug: true });
    });

    it('creates instances of non-injectable classes without injection', () => {
      class PlainClass {
        name = 'plain';
      }

      const container = new EmptyContainer();
      const instance = container.newInstanceOf(PlainClass);

      expect(instance.name).toBe('plain');
    });

    it('injects into singleton only once', () => {
      let resolveCount = 0;

      class TestContainer extends DiContainer {
        get dep() {
          resolveCount++;
          return 'resolved';
        }
      }

      @Injectable({ scope: 'singleton' })
      class SingletonWithDep {
        @Inject('dep') dep!: string;
      }

      const container = new TestContainer();
      container.newInstanceOf(SingletonWithDep);
      container.newInstanceOf(SingletonWithDep);

      expect(resolveCount).toBe(1);
    });
  });

  describe('inheritance', () => {
    it('allows extending with custom getters', () => {
      class AppContainer extends DiContainer {
        get version() {
          return '1.0.0';
        }

        get environment() {
          return 'test';
        }
      }

      const container = new AppContainer();

      expect(container.version).toBe('1.0.0');
      expect(container.environment).toBe('test');
      expect(container.resolve<string>('version')).toBe('1.0.0');
    });

    it('supports nested containers', () => {
      class ParentContainer extends DiContainer {
        get shared() {
          return 'shared-value';
        }
      }

      class ChildContainer extends ParentContainer {
        get child() {
          return 'child-value';
        }
      }

      const container = new ChildContainer();

      expect(container.shared).toBe('shared-value');
      expect(container.child).toBe('child-value');
    });
  });
});
