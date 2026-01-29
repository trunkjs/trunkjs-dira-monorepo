import { DiraController, DiraHttp, handler } from '@dira/core';
import type { AppRequest } from '../app-request';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../domain/customer';

@DiraController('/customers', { name: 'customers' })
export class CustomersController {
  @DiraHttp('/list', { method: 'GET', name: 'list' })
  async list(
    req: AppRequest<unknown, unknown, Record<string, string>>,
  ): Promise<{ customers: Customer[] }> {
    const customers = await req.customerService.list();
    return { customers };
  }

  @DiraHttp({ method: 'GET', name: 'get' })
  get = handler('/:id', async (req) => {
    const appReq = req as AppRequest<unknown, unknown, { id: string }>;
    const customer = await appReq.customerService.get(appReq.params.id);
    if (!customer) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return customer;
  });

  @DiraHttp('/create', { method: 'POST', name: 'create' })
  async create(
    req: AppRequest<CreateCustomerInput, unknown, Record<string, string>>,
  ): Promise<Customer> {
    const body = await req.json();
    return req.customerService.create(body);
  }

  @DiraHttp({ method: 'PUT', name: 'update' })
  update = handler<UpdateCustomerInput>()('/update/:id', async (req) => {
    const appReq = req as AppRequest<
      UpdateCustomerInput,
      unknown,
      { id: string }
    >;
    const body = await appReq.json();
    const customer = await appReq.customerService.update(
      appReq.params.id,
      body,
    );
    if (!customer) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return customer;
  });

  @DiraHttp({ method: 'DELETE', name: 'delete' })
  delete = handler('/delete/:id', async (req) => {
    const appReq = req as AppRequest<unknown, unknown, { id: string }>;
    const deleted = await appReq.customerService.delete(appReq.params.id);
    if (!deleted) {
      return new Response(JSON.stringify({ error: 'Customer not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return { deleted: true, id: appReq.params.id };
  });
}
