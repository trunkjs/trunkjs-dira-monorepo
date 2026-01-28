import { DiraController, DiraHttp, handler } from '@dira/dira-core';

@DiraController('/users')
export class UsersController {
  @DiraHttp()
  getUser = handler('/:id', (req) => {
    // req.params.id is automatically typed as string!
    return { userId: req.params.id };
  });

  @DiraHttp()
  getUserPost = handler('/:userId/posts/:postId', (req) => {
    // Both params are typed!
    return {
      userId: req.params.userId,
      postId: req.params.postId,
    };
  });

  @DiraHttp()
  getProfile = handler('/:id/profile', (req) => {
    return {
      userId: req.params.id,
      profile: { name: 'Test User', email: 'test@example.com' },
    };
  });
}
