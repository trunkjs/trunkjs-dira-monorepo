import { DiraController, DiraHttp, handler } from '@dira/core';

/**
 * Demonstrates path parameter handling.
 */
@DiraController('/users', { name: 'users' })
export class UsersController {
  /**
   * Single path parameter - auto-typed via handler()
   * GET /users/:id
   */
  @DiraHttp({ name: 'get' })
  getUser = handler('/:id', (req) => {
    return {
      userId: req.params.id,
      name: `User ${req.params.id}`,
    };
  });

  /**
   * Multiple path parameters
   * GET /users/:userId/posts/:postId
   */
  @DiraHttp({ name: 'get-user-post' })
  getUserPost = handler('/:userId/posts/:postId', (req) => {
    return {
      userId: req.params.userId,
      postId: req.params.postId,
      title: `Post ${req.params.postId} by User ${req.params.userId}`,
    };
  });
}
