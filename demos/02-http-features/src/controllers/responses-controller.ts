import { DiraController, DiraHttp } from '@dira/core';

/**
 * Demonstrates different response types.
 */
@DiraController('/responses', { name: 'responses' })
export class ResponsesController {
  /**
   * Returns object - auto-wrapped as JSON with 200 status
   */
  @DiraHttp('/object', { name: 'object' })
  object(): { type: string; data: number[] } {
    return { type: 'object', data: [1, 2, 3] };
  }

  /**
   * Returns array - auto-wrapped as JSON
   */
  @DiraHttp('/array', { name: 'array' })
  array(): string[] {
    return ['item1', 'item2', 'item3'];
  }

  /**
   * Returns string - auto-wrapped as JSON
   */
  @DiraHttp('/string', { name: 'string' })
  string(): string {
    return 'Hello, World!';
  }

  /**
   * Returns number - auto-wrapped as JSON
   */
  @DiraHttp('/number', { name: 'number' })
  number(): number {
    return 42;
  }

  /**
   * Returns boolean - auto-wrapped as JSON
   */
  @DiraHttp('/boolean', { name: 'boolean' })
  boolean(): boolean {
    return true;
  }

  /**
   * Returns null - 204 No Content
   */
  @DiraHttp('/null', { name: 'null' })
  null(): null {
    return null;
  }

  /**
   * Returns void (undefined) - 204 No Content
   */
  @DiraHttp('/void', { name: 'void' })
  void(): void {
    // No return statement
  }

  /**
   * Returns custom Response with specific status and headers
   */
  @DiraHttp('/custom', { name: 'custom' })
  custom(): Response {
    return new Response(JSON.stringify({ custom: true }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      },
    });
  }

  /**
   * Returns Response with redirect
   */
  @DiraHttp('/redirect', { name: 'redirect' })
  redirect(): Response {
    return new Response(null, {
      status: 302,
      headers: { Location: '/responses/object' },
    });
  }
}
