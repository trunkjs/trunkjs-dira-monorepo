import { DiraController, DiraHttp } from '@dira/dira-core';

@DiraController('/admin', { name: 'admin' })
export class AdminController {
  @DiraHttp('/status', { name: 'get-status' })
  async status(): Promise<Response> {
    return new Response(JSON.stringify({ admin: true, active: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  @DiraHttp('/users', { name: 'list-users' })
  async users(): Promise<Response> {
    return new Response(JSON.stringify({ users: ['alice', 'bob'] }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
