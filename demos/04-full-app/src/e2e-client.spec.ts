import { describe, expect, it, afterEach, beforeAll, afterAll } from 'bun:test';
import { join } from 'node:path';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { generateClient } from '@dira/codegen';
import { AppRequest } from './app-request';

describe('E2E Client Generation', () => {
  let adapter: HonoAdapter;
  let baseUrl: string;
  let tempDir: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clientModule: any;

  beforeAll(async () => {
    // Create temp directory for generated client
    tempDir = mkdtempSync(join(tmpdir(), 'dira-e2e-'));

    // Generate the client to a temp file
    const clientPath = join(tempDir, 'client.ts');
    generateClient({
      controllerGlobs: [join(import.meta.dirname, 'controllers')],
      tsconfig: join(import.meta.dirname, '../tsconfig.json'),
      outFile: clientPath,
      clientName: 'E2EClient',
      importTypes: false, // Don't use type imports for temp file (no domain types)
    });

    // Verify the client was generated
    expect(existsSync(clientPath)).toBe(true);

    // Import the generated client dynamically
    clientModule = await import(clientPath);

    // Start the server
    const dira = new DiraCore();
    dira.setRequestClass(AppRequest);
    await dira.discover(join(import.meta.dirname, 'controllers'));
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });
    baseUrl = `http://${adapter.hostname}:${adapter.port}`;
  });

  afterAll(() => {
    adapter?.stop();
    // Clean up temp directory
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true });
    }
  });

  afterEach(() => {
    // No per-test cleanup needed; server stays running for all tests
  });

  it('generated client has createClient function', () => {
    expect(typeof clientModule.createClient).toBe('function');
  });

  it('client.$routes contains all route metadata', () => {
    const client = clientModule.createClient(baseUrl);
    expect(client.$routes).toBeDefined();
    expect(client.$routes['health.check']).toBeDefined();
    expect(client.$routes['customers.list']).toBeDefined();
    expect(client.$routes['customers.create']).toBeDefined();
    expect(client.$routes['auth.login']).toBeDefined();
  });

  it('health endpoint returns status via generated client', async () => {
    const client = clientModule.createClient(baseUrl);
    const response = await client.health.check.$get();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('customers CRUD via generated client', async () => {
    const client = clientModule.createClient(baseUrl);

    // Create a customer
    const createResponse = await client.customers.create.$post({
      body: { name: 'E2E Test User', email: 'e2e@test.com' },
    });
    expect(createResponse.status).toBe(200);
    const created = (await createResponse.json()) as {
      id: string;
      name: string;
      email: string;
    };
    expect(created.name).toBe('E2E Test User');
    expect(created.email).toBe('e2e@test.com');
    expect(created.id).toBeDefined();

    // List customers
    const listResponse = await client.customers.list.$get();
    expect(listResponse.status).toBe(200);
    const list = (await listResponse.json()) as {
      customers: { id: string; name: string; email: string }[];
    };
    const found = list.customers.find((c) => c.id === created.id);
    expect(found).toBeDefined();

    // Get single customer
    const getResponse = await client.customers.get.$get({
      params: { id: created.id },
    });
    expect(getResponse.status).toBe(200);
    const customer = (await getResponse.json()) as {
      id: string;
      name: string;
      email: string;
    };
    expect(customer.id).toBe(created.id);

    // Update customer
    const updateResponse = await client.customers.update.$put({
      params: { id: created.id },
      body: { name: 'Updated E2E User' },
    });
    expect(updateResponse.status).toBe(200);
    const updated = (await updateResponse.json()) as { name: string };
    expect(updated.name).toBe('Updated E2E User');

    // Delete customer
    const deleteResponse = await client.customers.delete.$delete({
      params: { id: created.id },
    });
    expect(deleteResponse.status).toBe(200);
    const deleted = (await deleteResponse.json()) as { deleted: boolean };
    expect(deleted.deleted).toBe(true);

    // Verify deleted
    const verifyResponse = await client.customers.get.$get({
      params: { id: created.id },
    });
    expect(verifyResponse.status).toBe(404);
  });

  it('auth flow via generated client', async () => {
    const client = clientModule.createClient(baseUrl);

    // Login
    const loginResponse = await client.auth.login.$post({
      body: { username: 'admin', password: 'admin' },
    });
    expect(loginResponse.status).toBe(200);
    const loginBody = (await loginResponse.json()) as {
      token: string;
      expiresAt: string;
    };
    expect(loginBody.token).toBeDefined();

    // Access /me with token
    const meResponse = await client.auth.me.$get({
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    expect(meResponse.status).toBe(200);
    const meBody = (await meResponse.json()) as {
      user: { name: string; role: string };
    };
    expect(meBody.user.name).toBe('Admin User');
    expect(meBody.user.role).toBe('admin');

    // Logout
    const logoutResponse = await client.auth.logout.$post({
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    expect(logoutResponse.status).toBe(200);

    // Token should now be invalid
    const meResponse2 = await client.auth.me.$get({
      headers: { Authorization: `Bearer ${loginBody.token}` },
    });
    expect(meResponse2.status).toBe(401);
  });

  it('fails gracefully with invalid credentials via generated client', async () => {
    const client = clientModule.createClient(baseUrl);

    const loginResponse = await client.auth.login.$post({
      body: { username: 'invalid', password: 'invalid' },
    });
    expect(loginResponse.status).toBe(401);
  });

  it('returns 404 for non-existent customer', async () => {
    const client = clientModule.createClient(baseUrl);

    const response = await client.customers.get.$get({
      params: { id: 'non-existent-id' },
    });
    expect(response.status).toBe(404);
  });
});
