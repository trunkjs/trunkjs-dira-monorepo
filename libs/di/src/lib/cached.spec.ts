import { describe, expect, it } from 'bun:test';
import { Cached } from './cached';

describe('Cached', () => {
  describe('on getters', () => {
    it('caches result after first access', () => {
      let callCount = 0;

      class Service {
        @Cached()
        get timestamp() {
          callCount++;
          return Date.now();
        }
      }

      const service = new Service();
      const ts1 = service.timestamp;
      const ts2 = service.timestamp;

      expect(ts1).toBe(ts2);
      expect(callCount).toBe(1);
    });

    it('caches per instance', () => {
      let callCount = 0;

      class Service {
        @Cached()
        get random() {
          callCount++;
          return Math.random();
        }
      }

      const service1 = new Service();
      const service2 = new Service();

      const val1a = service1.random;
      const val1b = service1.random;
      const val2 = service2.random;

      expect(val1a).toBe(val1b);
      expect(val1a).not.toBe(val2);
      expect(callCount).toBe(2);
    });

    it('preserves this context', () => {
      class Service {
        private multiplier = 3;

        @Cached()
        get computed() {
          return 5 * this.multiplier;
        }
      }

      const service = new Service();
      expect(service.computed).toBe(15);
    });

    it('caches async getters', async () => {
      let callCount = 0;

      class Service {
        @Cached()
        get asyncValue(): Promise<number> {
          callCount++;
          return Promise.resolve(42);
        }
      }

      const service = new Service();
      const val1 = await service.asyncValue;
      const val2 = await service.asyncValue;

      expect(val1).toBe(42);
      expect(val2).toBe(42);
      expect(callCount).toBe(1);
    });

    it('handles null return value', () => {
      let callCount = 0;

      class Service {
        @Cached()
        get nullValue() {
          callCount++;
          return null;
        }
      }

      const service = new Service();
      expect(service.nullValue).toBeNull();
      expect(service.nullValue).toBeNull();
      expect(callCount).toBe(1);
    });

    it('handles undefined return value', () => {
      let callCount = 0;

      class Service {
        @Cached()
        get undefinedValue() {
          callCount++;
          return undefined;
        }
      }

      const service = new Service();
      expect(service.undefinedValue).toBeUndefined();
      expect(service.undefinedValue).toBeUndefined();
      // undefined IS cached - Map.has(key) returns true if key exists
      expect(callCount).toBe(1);
    });
  });

  describe('on methods', () => {
    it('throws Error when applied to a method', () => {
      expect(() => {
        class Service {
          @Cached()
          compute(x: number) {
            return x * 2;
          }
        }
        // Force class evaluation
        new Service();
      }).toThrow(Error);
    });

    it('error message mentions method name', () => {
      expect(() => {
        class Service {
          @Cached()
          myMethod() {
            return 'test';
          }
        }
        new Service();
      }).toThrow(/myMethod/);
    });

    it('error message indicates getters are supported', () => {
      expect(() => {
        class Service {
          @Cached()
          calculate() {
            return 123;
          }
        }
        new Service();
      }).toThrow(/getters/);
    });
  });
});
