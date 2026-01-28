import { DiraController, DiraHttp } from '@dira/dira-core';
import type { DiraRequest, ExtractParams } from '@dira/dira-core';

interface CreatePostBody {
  title: string;
  content: string;
  tags?: string[];
}

interface UpdatePostBody {
  title?: string;
  content?: string;
}

@DiraController('/posts')
export class PostsController {
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

  @DiraHttp('/:id/update')
  async updatePost(
    req: DiraRequest<UpdatePostBody, {}, ExtractParams<'/:id/update'>>,
  ) {
    const body = await req.json();

    return {
      id: req.params.id,
      updated: true,
      changes: body,
    };
  }

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

  @DiraHttp('/metadata')
  getMetadata(req: DiraRequest) {
    return {
      method: req.method,
      url: req.url,
      contentType: req.headers.get('content-type'),
    };
  }
}
