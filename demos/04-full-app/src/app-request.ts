import { DiraHttpRequest } from '@dira/core';
import { Cached } from '@dira/di';
import type { User } from './domain/user';
import { CustomerService } from './services/customer-service';
import { AuthService } from './services/auth-service';

/**
 * Custom request class with lazy authentication and service access.
 */
export class AppRequest<TBody, TQuery, TParams> extends DiraHttpRequest<
  TBody,
  TQuery,
  TParams
> {
  @Cached()
  get authToken(): string | null {
    return this.headers.get('authorization')?.replace('Bearer ', '') ?? null;
  }

  @Cached()
  get currentUser(): Promise<User | null> {
    const token = this.authToken;
    if (!token) return Promise.resolve(null);
    return this.authService.validateToken(token);
  }

  @Cached()
  get customerService(): CustomerService {
    return this.newInstanceOf(CustomerService);
  }

  @Cached()
  get authService(): AuthService {
    return this.newInstanceOf(AuthService);
  }
}
