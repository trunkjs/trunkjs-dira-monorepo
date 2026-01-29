import type { Context, Hono as HonoType } from 'hono';
import { Hono } from 'hono';
import type {
  DiraAdapter,
  DiraAdapterOptions,
  HttpMethod,
  RouteRegistration,
  ServerInfo,
} from '@dira/core';

type HonoMethodName = Lowercase<HttpMethod>;

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
      const wrappedHandler = (c: Context) => handler(c.req.raw);

      if (!methods || methods.length === 0) {
        // No methods specified - match all
        app.all(route, wrappedHandler);
      } else {
        // Register each allowed method using Hono's native method routing
        for (const method of methods) {
          const methodName = method.toLowerCase() as HonoMethodName;
          (app[methodName] as HonoType['get'])(route, wrappedHandler);
        }
        // Fallback: return 405 for any other method on this route
        app.all(route, () => {
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
