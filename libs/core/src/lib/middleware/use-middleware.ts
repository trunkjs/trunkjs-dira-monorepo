import { isStage3Decorator } from '@dira/common';
import type { DiraMiddleware } from './middleware-types';
import {
  setControllerMiddleware,
  setRouteMiddleware,
} from './middleware-storage';

/** Options for the @UseMiddleware decorator. */
export interface UseMiddlewareOptions {
  /** Optional name for debugging/logging. */
  name?: string;
}

/**
 * Decorator that attaches middleware to a controller class or method.
 *
 * Supports both Stage 3 and legacy TypeScript decorators.
 * Legacy decorator support is required because Bun currently uses legacy
 * decorators regardless of tsconfig settings.
 *
 * Middleware execution order follows a clear convention:
 * 1. Global middleware (in order of `.use()` calls)
 * 2. Controller-level middleware (in order of `@UseMiddleware` decorators)
 * 3. Method-level middleware (in order of `@UseMiddleware` decorators)
 *
 * @example
 * // Controller-level middleware
 * @UseMiddleware(authMiddleware)
 * @DiraController('/api')
 * class ApiController { ... }
 *
 * @example
 * // Method-level middleware
 * class ApiController {
 *   @UseMiddleware(rateLimitMiddleware)
 *   @DiraHttp('/data')
 *   getData() { ... }
 * }
 *
 * @example
 * // Multiple middleware
 * @UseMiddleware([authMiddleware, loggingMiddleware])
 * class SecureController { ... }
 */
export function UseMiddleware(
  middleware: DiraMiddleware | DiraMiddleware[],
  options?: UseMiddlewareOptions,
): ClassDecorator & MethodDecorator {
  const middlewareArray = Array.isArray(middleware) ? middleware : [middleware];
  const descriptors = middlewareArray.map((mw) => ({
    middleware: mw,
    name: options?.name,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function (
    targetOrMethod: any,
    contextOrPropertyKey?:
      | ClassDecoratorContext
      | ClassMethodDecoratorContext
      | string
      | symbol,
    descriptor?: PropertyDescriptor,
  ): any {
    if (isStage3Decorator(contextOrPropertyKey)) {
      const context = contextOrPropertyKey as
        | ClassDecoratorContext
        | ClassMethodDecoratorContext;

      if (context.kind === 'class') {
        // Stage 3 class decorator
        const target = targetOrMethod as Function;
        setControllerMiddleware(target, descriptors);
        return target;
      } else if (context.kind === 'method') {
        // Stage 3 method decorator
        const method = targetOrMethod as Function;
        context.addInitializer(function (this: object) {
          setRouteMiddleware(this.constructor, context.name, descriptors);
        });
        return method;
      }
    } else if (contextOrPropertyKey === undefined) {
      // Legacy class decorator: (constructor) => constructor
      const target = targetOrMethod as Function;
      setControllerMiddleware(target, descriptors);
      return target;
    } else {
      // Legacy method/property decorator: (target, propertyKey, descriptor?) => void
      const target = targetOrMethod as object;
      const propertyKey = contextOrPropertyKey as string | symbol;
      const ctor = target.constructor;

      if (descriptor && typeof descriptor.value === 'function') {
        // Method decorator
        setRouteMiddleware(ctor, propertyKey, descriptors);
      } else {
        // Property decorator (for handler() wrapper fields)
        setRouteMiddleware(ctor, propertyKey, descriptors);
      }
    }
  };
}
