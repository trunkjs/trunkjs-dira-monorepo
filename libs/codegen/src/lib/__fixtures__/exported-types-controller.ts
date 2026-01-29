import { DiraController, DiraHttp, handler } from '@dira/dira-core';
import type { DiraRequest } from '@dira/dira-core';

// Exported types - should be importable
export interface CreateUserBody {
  name: string;
  email: string;
}

export interface UpdateUserBody {
  name?: string;
  email?: string;
}

export interface UserQuery {
  includeDeleted?: string;
}

// Non-exported type - should fall back to inline
interface PrivateBody {
  secret: string;
}

@DiraController('/users', { name: 'users' })
export class ExportedTypesController {
  @DiraHttp('/create', { method: 'POST' })
  async createUser(req: DiraRequest<CreateUserBody>) {
    const body = await req.json();
    return { id: '1', name: body.name, email: body.email };
  }

  @DiraHttp()
  updateUser = handler<UpdateUserBody, UserQuery>()('/:id', async (req) => {
    const body = await req.json();
    return { id: req.params.id, ...body };
  });

  // Uses private (non-exported) type - should inline
  @DiraHttp('/private', { method: 'POST' })
  async privateEndpoint(req: DiraRequest<PrivateBody>) {
    const body = await req.json();
    return { received: body.secret };
  }

  // Uses inline anonymous type - should inline
  @DiraHttp('/inline', { method: 'POST' })
  async inlineEndpoint(req: DiraRequest<{ foo: string; bar: number }>) {
    const body = await req.json();
    return { foo: body.foo, bar: body.bar };
  }
}
