import { describe, expect, it } from 'bun:test';
import { errorHandlerMiddleware } from './error-middleware';
import { HttpError } from './http-error';

// Helper to create a mock request with context
function createMockRequest() {
  return {
    url: 'http://localhost/test',
    method: 'GET',
    headers: new Headers(),
    ctx: {},
  } as any;
}

describe('errorHandlerMiddleware', () => {
  it('should pass through successful responses', async () => {
    const middleware = errorHandlerMiddleware();
    const successResponse = new Response(JSON.stringify({ data: 'ok' }), {
      status: 200,
    });
    const next = () => Promise.resolve(successResponse);

    const response = await middleware(createMockRequest(), next);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ data: 'ok' });
  });

  it('should handle HttpError', async () => {
    const middleware = errorHandlerMiddleware();
    const next = () => Promise.reject(new HttpError(401, 'Unauthorized'));

    const response = await middleware(createMockRequest(), next);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe('Unauthorized');
    expect(body.status).toBe(401);
  });

  it('should include HttpError details', async () => {
    const middleware = errorHandlerMiddleware();
    const next = () =>
      Promise.reject(
        new HttpError(400, 'Bad request', { field: 'name', issue: 'required' }),
      );

    const response = await middleware(createMockRequest(), next);
    const body = await response.json();

    expect(body.details).toEqual({ field: 'name', issue: 'required' });
  });

  it('should handle standard Error', async () => {
    const middleware = errorHandlerMiddleware();
    const next = () => Promise.reject(new Error('Something went wrong'));

    const response = await middleware(createMockRequest(), next);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Something went wrong');
    expect(body.status).toBe(500);
  });

  it('should handle unknown error types', async () => {
    const middleware = errorHandlerMiddleware();
    const next = () => Promise.reject('string error');

    const response = await middleware(createMockRequest(), next);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Internal Server Error');
  });

  it('should include stack trace when enabled', async () => {
    const middleware = errorHandlerMiddleware({ includeStack: true });
    const next = () => Promise.reject(new Error('Test error'));

    const response = await middleware(createMockRequest(), next);
    const body = await response.json();

    expect(body.stack).toBeDefined();
    expect(body.stack).toContain('Test error');
  });

  it('should not include stack trace by default', async () => {
    const middleware = errorHandlerMiddleware();
    const next = () => Promise.reject(new Error('Test error'));

    const response = await middleware(createMockRequest(), next);
    const body = await response.json();

    expect('stack' in body).toBe(false);
  });

  it('should call onError callback', async () => {
    const capturedErrors: unknown[] = [];
    const middleware = errorHandlerMiddleware({
      onError: (err) => capturedErrors.push(err),
    });
    const error = new Error('Captured error');
    const next = () => Promise.reject(error);

    await middleware(createMockRequest(), next);

    expect(capturedErrors).toHaveLength(1);
    expect(capturedErrors[0]).toBe(error);
  });

  it('should continue even if onError throws', async () => {
    const middleware = errorHandlerMiddleware({
      onError: () => {
        throw new Error('Callback error');
      },
    });
    const next = () => Promise.reject(new Error('Original error'));

    const response = await middleware(createMockRequest(), next);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe('Original error');
  });

  it('should set Content-Type header', async () => {
    const middleware = errorHandlerMiddleware();
    const next = () => Promise.reject(new Error('Test'));

    const response = await middleware(createMockRequest(), next);

    expect(response.headers.get('Content-Type')).toBe('application/json');
  });
});
