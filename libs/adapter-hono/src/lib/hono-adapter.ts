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

    for (const { route, handler } of routes) {
      app.all(route, (c) => handler(c.req.raw));
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
