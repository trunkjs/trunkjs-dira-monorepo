import { DiraController, DiraHttp, type DiraRequest } from '@dira/core';

interface User {
  id: string;
  name: string;
}

const users: Record<string, User> = {
  '1': { id: '1', name: 'Alice' },
  '2': { id: '2', name: 'Bob' },
  '3': { id: '3', name: 'Charlie' },
};

@DiraController('/users')
export class UsersController {
  @DiraHttp('/', { method: 'GET' })
  list(): User[] {
    return Object.values(users);
  }

  @DiraHttp('/:id', { method: 'GET' })
  getById(
    req: DiraRequest<unknown, unknown, { id: string }>,
  ): User | { error: string } {
    const user = users[req.params.id];
    if (!user) {
      return { error: 'User not found' };
    }
    return user;
  }

  @DiraHttp('/:userId/posts/:postId', { method: 'GET' })
  getUserPost(
    req: DiraRequest<unknown, unknown, { userId: string; postId: string }>,
  ): { userId: string; postId: string } {
    return { userId: req.params.userId, postId: req.params.postId };
  }
}
