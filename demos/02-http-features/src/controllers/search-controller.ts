import { DiraController, DiraHttp, handler } from '@dira/core';

interface SearchQuery {
  q?: string;
  page?: string;
  limit?: string;
}

interface FilterQuery {
  tags?: string;
  active?: string;
}

/**
 * Demonstrates query parameter handling.
 */
@DiraController('/search', { name: 'search' })
export class SearchController {
  /**
   * Basic query parameters
   * GET /search?q=term&page=1&limit=10
   */
  @DiraHttp({ name: 'query' })
  search = handler<unknown, SearchQuery>()('/', (req) => {
    const query = req.query.q ?? '';
    const page = parseInt(req.query.page ?? '1', 10);
    const limit = parseInt(req.query.limit ?? '10', 10);

    return {
      query,
      page,
      limit,
      results: query
        ? Array.from(
            { length: limit },
            (_, i) => `Result ${i + 1} for "${query}"`,
          )
        : [],
    };
  });

  /**
   * Filter query parameters with array-like and boolean values
   * GET /search/filter?tags=a,b,c&active=true
   */
  @DiraHttp({ name: 'filter' })
  filter = handler<unknown, FilterQuery>()('/filter', (req) => {
    const tags = req.query.tags?.split(',') ?? [];
    const active = req.query.active === 'true';

    return {
      tags,
      active,
      results: tags.map(
        (tag) => `${active ? 'Active' : 'Inactive'} item with tag: ${tag}`,
      ),
    };
  });
}
