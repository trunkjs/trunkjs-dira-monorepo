import { describe, expect, it } from 'bun:test';
import { HttpError } from './http-error';

describe('HttpError', () => {
  it('should create error with status and message', () => {
    const error = new HttpError(404, 'Not found');
    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.details).toBeUndefined();
  });

  it('should create error with details', () => {
    const error = new HttpError(400, 'Validation failed', {
      field: 'email',
      reason: 'invalid format',
    });
    expect(error.status).toBe(400);
    expect(error.details).toEqual({ field: 'email', reason: 'invalid format' });
  });

  it('should have correct name', () => {
    const error = new HttpError(500, 'Server error');
    expect(error.name).toBe('HttpError');
  });

  it('should have stack trace', () => {
    const error = new HttpError(500, 'Server error');
    expect(error.stack).toBeDefined();
  });

  it('should serialize to JSON', () => {
    const error = new HttpError(403, 'Forbidden', { role: 'guest' });
    const json = error.toJSON();
    expect(json).toEqual({
      status: 403,
      message: 'Forbidden',
      details: { role: 'guest' },
    });
  });

  it('should exclude details from JSON when undefined', () => {
    const error = new HttpError(500, 'Error');
    const json = error.toJSON();
    expect(json).toEqual({ status: 500, message: 'Error' });
    expect('details' in json).toBe(false);
  });

  it('should be an instance of Error', () => {
    const error = new HttpError(500, 'Server error');
    expect(error instanceof Error).toBe(true);
  });

  it('should be throwable', () => {
    expect(() => {
      throw new HttpError(401, 'Unauthorized');
    }).toThrow('Unauthorized');
  });

  it('should be catchable with correct status', () => {
    try {
      throw new HttpError(403, 'Forbidden');
    } catch (e) {
      expect(e instanceof HttpError).toBe(true);
      expect((e as HttpError).status).toBe(403);
    }
  });
});
