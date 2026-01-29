import { DiraController, DiraHttp } from '@dira/core';
import type { DiraRequest } from '@dira/core';

@DiraController('/admin/users', { name: 'admin.users' })
export class AdminUsersController {
  @DiraHttp('/', { method: 'GET' })
  list(_req: DiraRequest) {
    return { users: [] as string[] };
  }

  @DiraHttp('/:id', { method: 'GET' })
  getById(_req: DiraRequest) {
    return { id: '1', name: 'Admin' };
  }
}
