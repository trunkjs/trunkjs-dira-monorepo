import { DiraController, DiraHttp } from '@dira/core';
import type { DiraHttpRequest } from '@dira/core';

@DiraController('/admin/users', { name: 'admin.users' })
export class AdminUsersController {
  @DiraHttp('/', { method: 'GET' })
  list(_req: DiraHttpRequest) {
    return { users: [] as string[] };
  }

  @DiraHttp('/:id', { method: 'GET' })
  getById(_req: DiraHttpRequest) {
    return { id: '1', name: 'Admin' };
  }
}
