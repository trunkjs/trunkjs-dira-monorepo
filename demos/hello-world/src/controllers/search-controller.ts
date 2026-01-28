import { DiraController, DiraHttp } from '@dira/dira-core';
import type { DiraRequest } from '@dira/dira-core';

interface SearchQuery {
  q: string;
  limit?: string;
  offset?: string;
}

interface FilterQuery {
  category?: string;
  tag?: string | string[];
  sort?: string;
}

@DiraController('/search')
export class SearchController {
  @DiraHttp('/')
  search(req: DiraRequest<unknown, SearchQuery>) {
    const query = req.query.q ?? '';
    const limit = parseInt(req.query.limit ?? '10', 10);
    const offset = parseInt(req.query.offset ?? '0', 10);

    return {
      query,
      limit,
      offset,
      results: [`Result for "${query}"`],
    };
  }

  @DiraHttp('/filter')
  filter(req: DiraRequest<unknown, FilterQuery>) {
    return {
      category: req.query.category ?? null,
      tags: req.query.tag ?? [],
      sort: req.query.sort ?? 'relevance',
    };
  }

  @DiraHttp('/raw-query')
  rawQuery(req: DiraRequest) {
    return { query: req.query };
  }
}
