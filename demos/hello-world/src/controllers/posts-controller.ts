import { DiraController, DiraHttp, handler } from '@dira/dira-core';
import type { DiraRequest } from '@dira/dira-core';

interface CreatePostBody {
  title: string;
  content: string;
  tags?: string[];
}

interface UpdatePostBody {
  title?: string;
  content?: string;
}

interface PublishPostBody {
  scheduledAt?: string;
  notifySubscribers: boolean;
}

interface PublishPostQuery {
  draft?: string;
  preview?: string;
}

@DiraController('/posts')
export class PostsController {
  // Traditional style for routes without path params
  @DiraHttp('/create')
  async createPost(req: DiraRequest<CreatePostBody>) {
    const body = await req.json();

    return {
      id: 'post-123',
      title: body.title,
      content: body.content,
      tags: body.tags ?? [],
      createdAt: new Date().toISOString(),
    };
  }

  // New handler() style with typed body and auto-inferred path params
  @DiraHttp()
  updatePost = handler<UpdatePostBody>()('/:id/update', async (req) => {
    // req.params.id is typed as string automatically!
    const body = await req.json(); // body is typed as UpdatePostBody!

    return {
      id: req.params.id,
      updated: true,
      changes: body,
    };
  });

  // Full example: path params + query params + body type
  @DiraHttp()
  publishPost = handler<PublishPostBody, PublishPostQuery>()(
    '/:authorId/posts/:postId/publish',
    async (req) => {
      const body = await req.json();

      return {
        authorId: req.params.authorId,
        postId: req.params.postId,
        scheduledAt: body.scheduledAt ?? null,
        notifySubscribers: body.notifySubscribers,
        isDraft: req.query.draft === 'true',
        isPreview: req.query.preview === 'true',
      };
    },
  );

  @DiraHttp('/from-text')
  async createFromText(req: DiraRequest) {
    const text = await req.text();

    return {
      receivedText: text,
      length: text.length,
    };
  }

  @DiraHttp('/from-form')
  async createFromForm(req: DiraRequest) {
    const formData = await req.formData();

    return {
      title: formData.get('title'),
      content: formData.get('content'),
    };
  }

  @DiraHttp('/metadata', {
    method: 'GET'
  })
  getMetadata(req: DiraRequest) {
    return {
      method: req.method,
      url: req.url,
      contentType: req.headers.get('content-type'),
    };
  }
}
