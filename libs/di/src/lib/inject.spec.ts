import { describe, expect, it } from 'bun:test';

import { Inject, getInjectMetadata } from './inject';
import { Injectable } from './injectable';

describe('Inject', () => {
  describe('@Inject() decorator', () => {
    it('stores injection token for properties', () => {
      @Injectable()
      class Service {
        @Inject('logger-service') myLogger!: unknown;
      }

      const metadata = getInjectMetadata(Service);
      // Property name is 'myLogger', token is 'logger-service'
      expect(metadata.get('myLogger')).toBe('logger-service');
    });

    it('supports multiple injected properties', () => {
      @Injectable()
      class Service {
        @Inject('logger-service') myLogger!: unknown;
        @Inject('app-config') appConfig!: unknown;
      }

      const metadata = getInjectMetadata(Service);
      expect(metadata.get('myLogger')).toBe('logger-service');
      expect(metadata.get('appConfig')).toBe('app-config');
    });

    it('works with private properties', () => {
      @Injectable()
      class Service {
        @Inject('database-connection') private dbConn!: unknown;

        getDbConn() {
          return this.dbConn;
        }
      }

      const metadata = getInjectMetadata(Service);
      expect(metadata.get('dbConn')).toBe('database-connection');
    });
  });

  describe('getInjectMetadata()', () => {
    it('returns metadata map for decorated class', () => {
      @Injectable()
      class Service {
        @Inject('my-dependency') someProp!: unknown;
      }

      const metadata = getInjectMetadata(Service);
      expect(metadata).toBeDefined();
      expect(metadata.get('someProp')).toBe('my-dependency');
    });

    it('returns empty map for non-decorated class', () => {
      class PlainClass {}

      const metadata = getInjectMetadata(PlainClass);
      expect(metadata.size).toBe(0);
    });

    it('returns all injected properties', () => {
      @Injectable()
      class Service {
        @Inject('token-a') propA!: unknown;
        @Inject('token-b') propB!: unknown;
        @Inject('token-c') propC!: unknown;
      }

      const metadata = getInjectMetadata(Service);
      expect(metadata.size).toBe(3);
    });
  });
});
