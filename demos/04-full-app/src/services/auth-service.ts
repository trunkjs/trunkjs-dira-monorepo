import { Injectable } from '@dira/di';
import type { User, AuthToken } from '../domain/user';

// Module-level token storage to persist across requests
const tokenStore = new Map<string, User>();

@Injectable()
export class AuthService {
  async login(username: string, password: string): Promise<AuthToken | null> {
    // Demo: accept admin/admin or user/user
    let user: User | null = null;

    if (username === 'admin' && password === 'admin') {
      user = { id: 'user-1', name: 'Admin User', role: 'admin' };
    } else if (username === 'user' && password === 'user') {
      user = { id: 'user-2', name: 'Regular User', role: 'user' };
    }

    if (!user) return null;

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

    tokenStore.set(token, user);

    return { token, expiresAt };
  }

  async validateToken(token: string): Promise<User | null> {
    return tokenStore.get(token) ?? null;
  }

  async logout(token: string): Promise<boolean> {
    return tokenStore.delete(token);
  }
}
