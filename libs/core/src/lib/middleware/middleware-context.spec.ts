import { describe, expect, it } from 'bun:test';
import {
  attachContext,
  ContextStore,
  createContextStore,
} from './middleware-context';

describe('ContextStore', () => {
  it('should set and get values', () => {
    const store = new ContextStore();
    store.set('user', { id: '123' });
    expect(store.get('user')).toEqual({ id: '123' });
  });

  it('should check if key exists', () => {
    const store = new ContextStore();
    expect(store.has('user')).toBe(false);
    store.set('user', { id: '123' });
    expect(store.has('user')).toBe(true);
  });

  it('should return undefined for missing keys', () => {
    const store = new ContextStore();
    expect(store.get('nonexistent')).toBeUndefined();
  });

  it('should return all stored data', () => {
    const store = new ContextStore();
    store.set('a', 1);
    store.set('b', 2);
    expect(store.getAll()).toEqual({ a: 1, b: 2 });
  });

  it('should return a copy from getAll', () => {
    const store = new ContextStore();
    store.set('a', 1);
    const all = store.getAll();
    all.b = 2;
    expect(store.has('b')).toBe(false);
  });
});

describe('createContextStore', () => {
  it('should create a new ContextStore instance', () => {
    const store = createContextStore();
    expect(store).toBeInstanceOf(ContextStore);
  });
});

describe('attachContext', () => {
  it('should add ctx property to request', () => {
    const store = new ContextStore();
    const request = { url: '/test' };
    const result = attachContext(request, store);
    expect('ctx' in result).toBe(true);
  });

  it('should allow setting context values via proxy', () => {
    const store = new ContextStore();
    const request = { url: '/test' };
    const result = attachContext<typeof request, { user: { id: string } }>(
      request,
      store,
    );
    result.ctx.user = { id: '123' };
    expect(store.get('user')).toEqual({ id: '123' });
  });

  it('should allow getting context values via proxy', () => {
    const store = new ContextStore();
    store.set('user', { id: '123' });
    const request = { url: '/test' };
    const result = attachContext<typeof request, { user: { id: string } }>(
      request,
      store,
    );
    expect(result.ctx.user).toEqual({ id: '123' });
  });

  it('should support has check via in operator', () => {
    const store = new ContextStore();
    const request = { url: '/test' };
    const result = attachContext<typeof request, { user?: { id: string } }>(
      request,
      store,
    );
    expect('user' in result.ctx).toBe(false);
    result.ctx.user = { id: '123' };
    expect('user' in result.ctx).toBe(true);
  });

  it('should support Object.keys on context', () => {
    const store = new ContextStore();
    store.set('a', 1);
    store.set('b', 2);
    const request = { url: '/test' };
    const result = attachContext(request, store);
    expect(Object.keys(result.ctx)).toEqual(['a', 'b']);
  });

  it('should preserve original request properties', () => {
    const store = new ContextStore();
    const request = { url: '/test', method: 'GET' };
    const result = attachContext(request, store);
    expect(result.url).toBe('/test');
    expect(result.method).toBe('GET');
  });
});
