import { DiraHttpRequest } from '@dira/core';
import { Cached } from '@dira/di';
import { LoggerService } from './services/logger-service';
import { ConfigService } from './services/config-service';
import { UserService } from './services/user-service';

interface User {
  id: string;
  name: string;
  role: string;
}

/**
 * Custom request class with lazy dependencies using @Cached.
 * Each getter is evaluated at most once per request.
 */
export class AppRequest<TBody, TQuery, TParams> extends DiraHttpRequest<
  TBody,
  TQuery,
  TParams
> {
  /**
   * Unique ID for this request - computed once per request.
   */
  @Cached()
  get requestId(): string {
    return crypto.randomUUID();
  }

  /**
   * Auth token from headers - computed once per request.
   */
  @Cached()
  get authToken(): string | null {
    return this.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  }

  /**
   * Current user - lazy async getter, cached per request.
   * Demonstrates chained lazy dependency on authToken.
   */
  @Cached()
  get currentUser(): Promise<User | null> {
    const token = this.authToken;
    if (!token) {
      return Promise.resolve(null);
    }
    // Simulated user lookup from token
    return Promise.resolve({
      id: 'user-1',
      name: 'Demo User',
      role: token === 'admin-token' ? 'admin' : 'user',
    });
  }

  /**
   * Logger service - singleton scoped to container (request).
   */
  @Cached()
  get logger(): LoggerService {
    return this.newInstanceOf(LoggerService);
  }

  /**
   * Config service - singleton scoped globally.
   */
  @Cached()
  get config(): ConfigService {
    return this.newInstanceOf(ConfigService);
  }

  /**
   * User service - with injected dependencies.
   * Dependencies are resolved from the request as container.
   */
  @Cached()
  get userService(): UserService {
    return this.newInstanceOf(UserService);
  }
}
