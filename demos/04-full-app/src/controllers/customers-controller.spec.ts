import { describe, expect, it, afterEach, beforeEach } from 'bun:test';
import { join } from 'node:path';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { AppRequest } from '../app-request';

interface Customer {
  id: string;
  name: string;
  email: string;
}

describe('CustomersController', () => {
  let adapter: HonoAdapter;
  let baseUrl: string;

  beforeEach(async () => {
    const dira = new DiraCore();
    dira.setRequestClass(AppRequest);
    await dira.discover(join(import.meta.dirname, '.'));
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });
    baseUrl = `http://${adapter.hostname}:${adapter.port}`;
  });

  afterEach(() => {
    adapter?.stop();
  });

  it('creates and lists customers', async () => {
    // Create a customer (POST /customers/create)
    const createResponse = await fetch(`${baseUrl}/customers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
    });
    expect(createResponse.status).toBe(200);
    const created = (await createResponse.json()) as Customer;
    expect(created.name).toBe('John Doe');
    expect(created.email).toBe('john@example.com');
    expect(created.id).toBeDefined();

    // List customers (GET /customers/list)
    const listResponse = await fetch(`${baseUrl}/customers/list`);
    expect(listResponse.status).toBe(200);
    const list = (await listResponse.json()) as { customers: Customer[] };
    expect(list.customers.length).toBeGreaterThanOrEqual(1);
  });

  it('gets a single customer', async () => {
    // Create (POST /customers/create)
    const createResponse = await fetch(`${baseUrl}/customers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jane Doe', email: 'jane@example.com' }),
    });
    const created = (await createResponse.json()) as Customer;

    // Get (GET /customers/:id)
    const getResponse = await fetch(`${baseUrl}/customers/${created.id}`);
    expect(getResponse.status).toBe(200);
    const customer = (await getResponse.json()) as Customer;
    expect(customer.name).toBe('Jane Doe');
  });

  it('returns 404 for non-existent customer', async () => {
    const response = await fetch(`${baseUrl}/customers/999`);
    expect(response.status).toBe(404);
  });

  it('updates a customer', async () => {
    // Create (POST /customers/create)
    const createResponse = await fetch(`${baseUrl}/customers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Old Name', email: 'old@example.com' }),
    });
    const created = (await createResponse.json()) as Customer;

    // Update (PUT /customers/update/:id)
    const updateResponse = await fetch(
      `${baseUrl}/customers/update/${created.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      },
    );
    expect(updateResponse.status).toBe(200);
    const updated = (await updateResponse.json()) as Customer;
    expect(updated.name).toBe('New Name');
    expect(updated.email).toBe('old@example.com'); // Unchanged
  });

  it('deletes a customer', async () => {
    // Create (POST /customers/create)
    const createResponse = await fetch(`${baseUrl}/customers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'To Delete', email: 'delete@example.com' }),
    });
    const created = (await createResponse.json()) as Customer;

    // Delete (DELETE /customers/delete/:id)
    const deleteResponse = await fetch(
      `${baseUrl}/customers/delete/${created.id}`,
      {
        method: 'DELETE',
      },
    );
    expect(deleteResponse.status).toBe(200);
    const deleted = (await deleteResponse.json()) as { deleted: boolean };
    expect(deleted.deleted).toBe(true);

    // Verify gone
    const getResponse = await fetch(`${baseUrl}/customers/${created.id}`);
    expect(getResponse.status).toBe(404);
  });

  it('returns 404 when updating non-existent customer', async () => {
    const response = await fetch(`${baseUrl}/customers/update/non-existent`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New Name' }),
    });
    expect(response.status).toBe(404);
  });

  it('returns 404 when deleting non-existent customer', async () => {
    const response = await fetch(`${baseUrl}/customers/delete/non-existent`, {
      method: 'DELETE',
    });
    expect(response.status).toBe(404);
  });
});
