import { Hono } from 'hono';
import type { DiraAdapter, DiraAdapterOptions, RouteRegistration, ServerInfo } from '@dira/dira-core';

export class HonoAdapter implements DiraAdapter {
  private server: ReturnType<typeof Bun.serve> | null = null;

  /** The port the server is listening on (available after start()) */
  get port(): number {
    return this.server?.port ?? 0;
  }

  /** The hostname the server is bound to (available after start()) */
  get hostname(): string {
    return this.server?.hostname ?? 'localhost';
  }

  async start(
    routes: RouteRegistration[],
    options?: DiraAdapterOptions,
  ): Promise<ServerInfo> {
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

    const actualPort = this.server.port;
    const actualHostname = this.server.hostname;

    console.log(`Server running at http://${actualHostname}:${actualPort}`);

    return { port: actualPort, hostname: actualHostname };
  }

  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }
}
