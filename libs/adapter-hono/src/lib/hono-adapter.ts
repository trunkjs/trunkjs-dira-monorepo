import { Hono } from 'hono';
import type { DiraAdapter } from '@dira/dira-core';
import type { DiraAdapterOptions } from '@dira/dira-core';
import type { RouteRegistration } from '@dira/dira-core';

export class HonoAdapter implements DiraAdapter {
  private server: ReturnType<typeof Bun.serve> | null = null;

  async start(
    routes: RouteRegistration[],
    options?: DiraAdapterOptions,
  ): Promise<void> {
    const app = new Hono();

    for (const { route, handler, methods } of routes) {
      if (!methods || methods.length === 0) {
        // No methods specified - match all
        app.all(route, (c) => handler(c.req.raw));
      } else {
        // Method-restricted route: check method and return 405 if not allowed
        app.all(route, (c) => {
          const requestMethod = c.req.method.toUpperCase();
          if (methods.includes(requestMethod as (typeof methods)[number])) {
            return handler(c.req.raw);
          }
          // Method not allowed - return 405 with Allow header
          return new Response(null, {
            status: 405,
            headers: { Allow: methods.join(', ') },
          });
        });
      }
    }

    const port = options?.port ?? 3000;
    const hostname = options?.hostname ?? 'localhost';

    this.server = Bun.serve({
      port,
      hostname,
      fetch: app.fetch,
    });

    console.log(`Server running at http://${hostname}:${port}`);
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }
}
