import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { HonoAdapter } from '@dira/adapter-hono';
import { BunAdapter } from '@dira/adapter-bun';
import { createApp } from '../src/create-app';

/**
 * E2E tests demonstrating adapter-agnostic behavior.
 *
 * Both adapters are started in parallel with identical app configuration.
 * Each test makes the same request to both adapters and verifies
 * identical responses - proving true adapter-agnosticism.
 */
describe('Adapter-Agnostic Behavior', () => {
  let honoAdapter: HonoAdapter;
  let bunAdapter: BunAdapter;
  let honoBaseUrl: string;
  let bunBaseUrl: string;

  beforeAll(async () => {
    // Start both adapters with the same app configuration
    const honoApp = createApp();
    const bunApp = createApp();

    honoAdapter = new HonoAdapter();
    bunAdapter = new BunAdapter();

    // Run both adapters in parallel
    await Promise.all([
      honoApp.run(honoAdapter, { port: 0 }),
      bunApp.run(bunAdapter, { port: 0 }),
    ]);

    honoBaseUrl = `http://${honoAdapter.hostname}:${honoAdapter.port}`;
    bunBaseUrl = `http://${bunAdapter.hostname}:${bunAdapter.port}`;

    console.log(`Hono adapter running at ${honoBaseUrl}`);
    console.log(`Bun adapter running at ${bunBaseUrl}`);
  });

  afterAll(() => {
    honoAdapter?.stop();
    bunAdapter?.stop();
  });

  /**
   * Helper to fetch from both adapters and compare responses.
   */
  async function fetchBoth(
    path: string,
    options?: RequestInit,
  ): Promise<{ hono: Response; bun: Response }> {
    const [hono, bun] = await Promise.all([
      fetch(`${honoBaseUrl}${path}`, options),
      fetch(`${bunBaseUrl}${path}`, options),
    ]);
    return { hono, bun };
  }

  /**
   * Helper to compare JSON responses from both adapters.
   */
  async function expectIdenticalJson(
    path: string,
    options?: RequestInit,
  ): Promise<void> {
    const { hono, bun } = await fetchBoth(path, options);

    expect(hono.status).toBe(bun.status);
    expect(hono.headers.get('content-type')).toBe(
      bun.headers.get('content-type'),
    );

    const honoJson = await hono.json();
    const bunJson = await bun.json();

    expect(honoJson).toEqual(bunJson);
  }

  describe('Static routes', () => {
    it('GET /echo/message returns identical response', async () => {
      await expectIdenticalJson('/echo/message');
    });

    it('GET /users/ returns identical user list', async () => {
      await expectIdenticalJson('/users/');
    });
  });

  describe('Route parameters', () => {
    it('GET /users/:id extracts params identically', async () => {
      await expectIdenticalJson('/users/1');
      await expectIdenticalJson('/users/2');
      await expectIdenticalJson('/users/999'); // Non-existent user
    });

    it('GET /users/:userId/posts/:postId handles multiple params', async () => {
      await expectIdenticalJson('/users/42/posts/100');
    });
  });

  describe('Wildcard routes', () => {
    it('GET /files/::path captures full path', async () => {
      await expectIdenticalJson('/files/documents/reports/2024/q1.pdf');
      await expectIdenticalJson('/files/a/b/c/d/e');
    });
  });

  describe('Query parameters', () => {
    it('GET /echo/query parses query params identically', async () => {
      await expectIdenticalJson('/echo/query?name=Alice&count=42');
    });
  });

  describe('HTTP methods', () => {
    it('POST /echo/message with body returns identical response', async () => {
      await expectIdenticalJson('/echo/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: 'Hello from test!' }),
      });
    });

    it('All HTTP methods on /methods/resource work identically', async () => {
      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        await expectIdenticalJson('/methods/resource', { method });
      }
    });

    it('Wildcard method route accepts all methods identically', async () => {
      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        await expectIdenticalJson('/methods/any-method', { method });
      }
    });
  });

  describe('405 Method Not Allowed', () => {
    it('Returns 405 with Allow header for restricted routes', async () => {
      const { hono, bun } = await fetchBoth('/echo/message', {
        method: 'DELETE',
      });

      expect(hono.status).toBe(405);
      expect(bun.status).toBe(405);

      expect(hono.headers.get('Allow')).toBe(bun.headers.get('Allow'));
    });
  });

  describe('404 Not Found', () => {
    it('Returns 404 for non-existent routes', async () => {
      const { hono, bun } = await fetchBoth('/does-not-exist');

      expect(hono.status).toBe(404);
      expect(bun.status).toBe(404);
    });
  });

  describe('Response headers', () => {
    it('Content-Type is identical for JSON responses', async () => {
      const { hono, bun } = await fetchBoth('/users/');

      expect(hono.headers.get('content-type')).toBe(
        bun.headers.get('content-type'),
      );
    });
  });

  describe('Concurrent requests', () => {
    it('Handles multiple concurrent requests identically', async () => {
      const paths = [
        '/echo/message',
        '/users/',
        '/users/1',
        '/users/2',
        '/methods/resource',
        '/files/path/to/file.txt',
      ];

      // Fire all requests concurrently
      const results = await Promise.all(
        paths.map(async (path) => {
          const { hono, bun } = await fetchBoth(path);
          return {
            path,
            honoStatus: hono.status,
            bunStatus: bun.status,
            honoJson: await hono.json(),
            bunJson: await bun.json(),
          };
        }),
      );

      // Verify all responses match
      for (const result of results) {
        expect(result.honoStatus).toBe(result.bunStatus);
        expect(result.honoJson).toEqual(result.bunJson);
      }
    });
  });
});
