import type {
  DiraAdapter,
  DiraAdapterOptions,
  HttpMethod,
  RouteRegistration,
  ServerInfo,
} from '@dira/core';
import { compileRoute, matchRoute, type CompiledRoute } from './route-matcher';

interface RegisteredRoute {
  compiled: CompiledRoute;
  handler: (request: Request) => Promise<Response>;
  methods?: HttpMethod[];
}

export class BunAdapter implements DiraAdapter {
  private server: ReturnType<typeof Bun.serve> | null = null;
  private routes: RegisteredRoute[] = [];

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
    // Compile all routes upfront for efficient matching
    this.routes = routes.map((reg) => ({
      compiled: compileRoute(reg.route),
      handler: reg.handler,
      methods: reg.methods,
    }));

    const port = options?.port ?? 3000;
    const hostname = options?.hostname ?? 'localhost';

    this.server = Bun.serve({
      port,
      hostname,
      fetch: (request) => this.handleRequest(request),
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

  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method as HttpMethod;

    // Find first matching route
    for (const route of this.routes) {
      const match = matchRoute(route.compiled, pathname);

      if (!match.matched) {
        continue;
      }

      // Check method restrictions
      if (route.methods && route.methods.length > 0) {
        if (!route.methods.includes(method)) {
          // Method not allowed - return 405 with Allow header
          return new Response(null, {
            status: 405,
            headers: { Allow: route.methods.join(', ') },
          });
        }
      }

      // Route matches and method is allowed - call handler
      return route.handler(request);
    }

    // No route matched - return 404
    return new Response('Not Found', { status: 404 });
  }
}
