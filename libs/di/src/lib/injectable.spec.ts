import { describe, expect, it } from 'bun:test';

import { Injectable, isInjectable, getInjectableScope } from './injectable';

describe('Injectable', () => {
  describe('@Injectable() decorator', () => {
    it('marks a class as injectable', () => {
      @Injectable()
      class Service {}

      expect(isInjectable(Service)).toBe(true);
    });

    it('does not mark undecorated classes', () => {
      class PlainClass {}

      expect(isInjectable(PlainClass)).toBe(false);
    });

    it('defaults to transient scope', () => {
      @Injectable()
      class TransientService {}

      expect(getInjectableScope(TransientService)).toBe('transient');
    });

    it('accepts explicit transient scope', () => {
      @Injectable({ scope: 'transient' })
      class TransientService {}

      expect(getInjectableScope(TransientService)).toBe('transient');
    });

    it('accepts singleton scope', () => {
      @Injectable({ scope: 'singleton' })
      class SingletonService {}

      expect(getInjectableScope(SingletonService)).toBe('singleton');
    });
  });

  describe('isInjectable()', () => {
    it('returns true for injectable classes', () => {
      @Injectable()
      class Service {}

      expect(isInjectable(Service)).toBe(true);
    });

    it('returns false for non-injectable classes', () => {
      class PlainClass {}

      expect(isInjectable(PlainClass)).toBe(false);
    });
  });

  describe('getInjectableScope()', () => {
    it('returns scope for injectable classes', () => {
      @Injectable({ scope: 'singleton' })
      class Service {}

      expect(getInjectableScope(Service)).toBe('singleton');
    });

    it('returns undefined for non-injectable classes', () => {
      class PlainClass {}

      expect(getInjectableScope(PlainClass)).toBeUndefined();
    });
  });
});
