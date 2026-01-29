import { describe, expect, it, afterEach } from 'bun:test';
import { join } from 'node:path';
import { DiraCore } from '@dira/core';
import { HonoAdapter } from '@dira/adapter-hono';
import { AppRequest } from '../app-request';

describe('DI Demo', () => {
  let adapter: HonoAdapter;

  afterEach(() => {
    adapter?.stop();
  });

  async function setupServer(): Promise<string> {
    const dira = new DiraCore();
    dira.setRequestClass(AppRequest);
    await dira.discover(join(import.meta.dirname, '.'));
    adapter = new HonoAdapter();
    await dira.run(adapter, { port: 0 });
    return `http://${adapter.hostname}:${adapter.port}`;
  }

  it('requestId is cached per request via @Cached', async () => {
    const baseUrl = await setupServer();

    const response = await fetch(`${baseUrl}/di/request-info`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      sameRequestId: boolean;
      requestId1: string;
      requestId2: string;
    };
    expect(body.sameRequestId).toBe(true);
    expect(body.requestId1).toBe(body.requestId2);
  });

  it('requestId differs between requests', async () => {
    const baseUrl = await setupServer();

    const response1 = await fetch(`${baseUrl}/di/request-info`);
    const body1 = (await response1.json()) as { requestId1: string };

    const response2 = await fetch(`${baseUrl}/di/request-info`);
    const body2 = (await response2.json()) as { requestId1: string };

    expect(body1.requestId1).not.toBe(body2.requestId1);
  });

  it('currentUser returns null without auth header', async () => {
    const baseUrl = await setupServer();

    const response = await fetch(`${baseUrl}/di/current-user`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      isAuthenticated: boolean;
      user: unknown;
    };
    expect(body.isAuthenticated).toBe(false);
    expect(body.user).toBeNull();
  });

  it('currentUser returns user with auth header', async () => {
    const baseUrl = await setupServer();

    const response = await fetch(`${baseUrl}/di/current-user`, {
      headers: { Authorization: 'Bearer admin-token' },
    });
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      isAuthenticated: boolean;
      user: { id: string; name: string; role: string };
    };
    expect(body.isAuthenticated).toBe(true);
    expect(body.user).toEqual({
      id: 'user-1',
      name: 'Demo User',
      role: 'admin',
    });
  });

  it('services are instantiated with DI', async () => {
    const baseUrl = await setupServer();

    const response = await fetch(`${baseUrl}/di/services`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      loggerInstanceId: string;
      configInstanceId: string;
      userServiceInstanceId: string;
      configFromUserService: string;
    };
    expect(body.loggerInstanceId).toBeDefined();
    expect(body.configInstanceId).toBeDefined();
    expect(body.userServiceInstanceId).toBeDefined();
    // ConfigService is singleton - same instance in userService
    expect(body.configFromUserService).toBe(body.configInstanceId);
  });

  it('getUser via UserService with @Inject', async () => {
    const baseUrl = await setupServer();

    const response = await fetch(`${baseUrl}/di/1`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      found: boolean;
      user: { id: string; name: string; email: string };
    };
    expect(body.found).toBe(true);
    expect(body.user).toEqual({
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
    });
  });

  it('getUser returns null for unknown user', async () => {
    const baseUrl = await setupServer();

    const response = await fetch(`${baseUrl}/di/999`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as { found: boolean; user: unknown };
    expect(body.found).toBe(false);
    expect(body.user).toBeNull();
  });

  it('@Cached on getters caches within same request', async () => {
    const baseUrl = await setupServer();

    const response = await fetch(`${baseUrl}/di/scopes`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as {
      sameLogger: boolean;
      sameConfig: boolean;
    };
    expect(body.sameLogger).toBe(true);
    expect(body.sameConfig).toBe(true);
  });
});
