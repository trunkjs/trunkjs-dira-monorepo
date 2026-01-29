import { DiraController, DiraHttp, handler } from '@dira/core';
import type { DiraRequest } from '@dira/core';

interface CreateItemBody {
  name: string;
  value: number;
}

interface SearchQuery {
  q: string;
  limit?: string;
}

@DiraController('/items', { name: 'items' })
export class ItemsController {
  @DiraHttp('/create', { method: 'POST' })
  async createItem(req: DiraRequest<CreateItemBody>) {
    const body = await req.json();
    return { id: '1', name: body.name, value: body.value };
  }

  @DiraHttp('/', { method: 'GET' })
  listItems(_req: DiraRequest) {
    return { items: [] as string[] };
  }

  @DiraHttp()
  getItem = handler('/:id', (req) => {
    return { id: req.params.id };
  });

  @DiraHttp()
  updateItem = handler<CreateItemBody>()('/:id', async (req) => {
    const body = await req.json();
    return { id: req.params.id, ...body };
  });

  @DiraHttp('/search', { method: 'GET' })
  search(req: DiraRequest<unknown, SearchQuery>) {
    return { query: req.query.q, results: [] as string[] };
  }

  @DiraHttp({ method: 'DELETE' })
  deleteItem = handler('/:id', (req) => {
    return { deleted: req.params.id };
  });

  @DiraHttp('/status', { method: 'GET', name: 'get-status' })
  getStatus(_req: DiraRequest) {
    return { status: 'ok' };
  }
}
