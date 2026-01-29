import { describe, expect, test } from 'bun:test';
import { handler, isHandlerWrapper, HANDLER_WRAPPER } from './handler';

describe('handler', () => {
  describe('direct form', () => {
    test('creates handler wrapper with route and handler', () => {
      const fn = () => ({ test: true });
      const wrapper = handler('/test', fn);

      expect(wrapper.route).toBe('/test');
      expect(wrapper.handler).toBe(fn);
      expect(wrapper[HANDLER_WRAPPER]).toBe(true);
    });

    test('preserves route literal type', () => {
      const wrapper = handler('/:id', (req) => {
        // Type test: req.params.id should be typed as string
        const id: string = req.params.id;
        return { id };
      });

      expect(wrapper.route).toBe('/:id');
    });

    test('preserves multiple path params', () => {
      const wrapper = handler('/:userId/posts/:postId', (req) => {
        const userId: string = req.params.userId;
        const postId: string = req.params.postId;
        return { userId, postId };
      });

      expect(wrapper.route).toBe('/:userId/posts/:postId');
    });
  });

  describe('curried form', () => {
    test('creates handler wrapper with typed body', () => {
      interface TestBody {
        name: string;
      }

      const wrapper = handler<TestBody>()('/:id', async (req) => {
        const body = await req.json();
        // Type test: body should be TestBody
        const name: string = body.name;
        return { id: req.params.id, name };
      });

      expect(wrapper.route).toBe('/:id');
      expect(wrapper[HANDLER_WRAPPER]).toBe(true);
    });

    test('preserves path params with typed body', () => {
      interface UpdateBody {
        value: number;
      }

      const wrapper = handler<UpdateBody>()('/:a/:b', async (req) => {
        const body = await req.json();
        // Type test: params and body both typed
        const a: string = req.params.a;
        const b: string = req.params.b;
        const value: number = body.value;
        return { a, b, value };
      });

      expect(wrapper.route).toBe('/:a/:b');
    });

    test('supports typed query params', () => {
      interface SearchQuery {
        q: string;
        limit?: string;
      }

      const wrapper = handler<never, SearchQuery>()('/search', (req) => {
        // Type test: query should be SearchQuery
        const q: string = req.query.q;
        return { query: q };
      });

      expect(wrapper.route).toBe('/search');
    });

    test('supports path params, query params, and body together', () => {
      interface UpdateBody {
        title: string;
        content: string;
      }

      interface UpdateQuery {
        draft?: string;
        notify?: string;
      }

      const wrapper = handler<UpdateBody, UpdateQuery>()(
        '/:userId/posts/:postId',
        async (req) => {
          const body = await req.json();
          // Type test: all three are typed correctly
          const userId: string = req.params.userId;
          const postId: string = req.params.postId;
          const title: string = body.title;
          const content: string = body.content;
          const draft: string | undefined = req.query.draft;
          const notify: string | undefined = req.query.notify;

          return {
            userId,
            postId,
            title,
            content,
            options: { draft, notify },
          };
        },
      );

      expect(wrapper.route).toBe('/:userId/posts/:postId');
      expect(wrapper[HANDLER_WRAPPER]).toBe(true);
    });
  });
});

describe('isHandlerWrapper', () => {
  test('returns true for handler wrapper', () => {
    const wrapper = handler('/test', () => ({}));
    expect(isHandlerWrapper(wrapper)).toBe(true);
  });

  test('returns false for plain function', () => {
    const fn = () => ({});
    expect(isHandlerWrapper(fn)).toBe(false);
  });

  test('returns false for plain object', () => {
    const obj = { route: '/test', handler: () => ({}) };
    expect(isHandlerWrapper(obj)).toBe(false);
  });

  test('returns false for null', () => {
    expect(isHandlerWrapper(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isHandlerWrapper(undefined)).toBe(false);
  });

  test('returns false for primitive', () => {
    expect(isHandlerWrapper('string')).toBe(false);
    expect(isHandlerWrapper(42)).toBe(false);
  });
});
