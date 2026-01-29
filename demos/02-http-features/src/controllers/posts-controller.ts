import { DiraController, DiraHttp, DiraHttpRequest, handler } from '@dira/core';

interface CreatePostBody {
  title: string;
  content: string;
}

interface UpdatePostBody {
  title?: string;
  content?: string;
}

/**
 * Demonstrates HTTP methods and request body handling.
 */
@DiraController('/posts', { name: 'posts' })
export class PostsController {
  private posts = new Map<
    string,
    { id: string; title: string; content: string }
  >();
  private nextId = 1;

  /**
   * GET all posts
   * GET /posts/list
   */
  @DiraHttp('/list', { method: 'GET', name: 'list' })
  list(): { posts: { id: string; title: string; content: string }[] } {
    return { posts: Array.from(this.posts.values()) };
  }

  /**
   * POST - Create new post with JSON body
   * POST /posts/create
   */
  @DiraHttp('/create', { method: 'POST', name: 'create' })
  async create(
    req: DiraHttpRequest<CreatePostBody>,
  ): Promise<{ id: string; title: string; content: string }> {
    const body = await req.json();
    const id = String(this.nextId++);
    const post = { id, title: body.title, content: body.content };
    this.posts.set(id, post);
    return post;
  }

  /**
   * PUT - Update existing post (path param + body)
   * PUT /posts/update/:id
   */
  @DiraHttp({ method: 'PUT', name: 'update' })
  update = handler<UpdatePostBody>()('/update/:id', async (req) => {
    const post = this.posts.get(req.params.id);
    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    if (body.title !== undefined) post.title = body.title;
    if (body.content !== undefined) post.content = body.content;

    return post;
  });

  /**
   * DELETE - Remove a post
   * DELETE /posts/delete/:id
   */
  @DiraHttp({ method: 'DELETE', name: 'delete' })
  delete = handler('/delete/:id', (req) => {
    const existed = this.posts.delete(req.params.id);
    if (!existed) {
      return new Response(JSON.stringify({ error: 'Post not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return { deleted: true, id: req.params.id };
  });
}
