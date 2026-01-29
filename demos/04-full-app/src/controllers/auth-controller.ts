import { DiraController, DiraHttp } from '@dira/core';
import type { AppRequest } from '../app-request';
import type { LoginInput, AuthToken, User } from '../domain/user';

@DiraController('/auth', { name: 'auth' })
export class AuthController {
  @DiraHttp('/login', { method: 'POST', name: 'login' })
  async login(
    req: AppRequest<LoginInput, unknown, Record<string, string>>,
  ): Promise<AuthToken | Response> {
    const body = await req.json();
    const result = await req.authService.login(body.username, body.password);

    if (!result) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return result;
  }

  @DiraHttp('/me', { name: 'me' })
  async me(
    req: AppRequest<unknown, unknown, Record<string, string>>,
  ): Promise<{ user: User } | Response> {
    const user = await req.currentUser;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return { user };
  }

  @DiraHttp('/logout', { method: 'POST', name: 'logout' })
  async logout(
    req: AppRequest<unknown, unknown, Record<string, string>>,
  ): Promise<{ success: boolean }> {
    const token = req.authToken;
    if (token) {
      await req.authService.logout(token);
    }
    return { success: true };
  }
}
