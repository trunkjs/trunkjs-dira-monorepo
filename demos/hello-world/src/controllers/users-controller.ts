import { DiraController, DiraHttp } from '@dira/dira-core';
import type { DiraRequest, ExtractParams } from '@dira/dira-core';

@DiraController('/users')
export class UsersController {
  @DiraHttp('/:id')
  getUser(req: DiraRequest<unknown, {}, ExtractParams<'/:id'>>) {
    return { userId: req.params.id };
  }

  @DiraHttp('/:userId/posts/:postId')
  getUserPost(
    req: DiraRequest<unknown, {}, ExtractParams<'/:userId/posts/:postId'>>,
  ) {
    return {
      userId: req.params.userId,
      postId: req.params.postId,
    };
  }

  @DiraHttp('/:id/profile')
  getProfile(req: DiraRequest<unknown, {}, ExtractParams<'/:id/profile'>>) {
    return {
      userId: req.params.id,
      profile: { name: 'Test User', email: 'test@example.com' },
    };
  }
}
