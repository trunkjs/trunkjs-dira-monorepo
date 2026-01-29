import { describe, expect, it } from 'bun:test';
import { DiraError } from './dira-error';

describe('DiraError', () => {
  it('should create an error with the correct message', () => {
    const error = new DiraError('Test error message');
    expect(error.message).toBe('Test error message');
  });

  it('should have the name "DiraError"', () => {
    const error = new DiraError('Test');
    expect(error.name).toBe('DiraError');
  });

  it('should be an instance of Error', () => {
    const error = new DiraError('Test');
    expect(error).toBeInstanceOf(Error);
  });

  it('should be an instance of DiraError', () => {
    const error = new DiraError('Test');
    expect(error).toBeInstanceOf(DiraError);
  });

  it('should have a stack trace', () => {
    const error = new DiraError('Test');
    expect(error.stack).toBeDefined();
    expect(error.stack).toContain('DiraError');
  });

  it('should be catchable as DiraError', () => {
    let caught = false;
    try {
      throw new DiraError('Test');
    } catch (e) {
      if (e instanceof DiraError) {
        caught = true;
      }
    }
    expect(caught).toBe(true);
  });
});
