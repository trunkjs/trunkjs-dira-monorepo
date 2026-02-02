import type { MiddlewareDescriptor } from './middleware-types';

/** WeakMap storing controller-level middleware keyed by class constructor. */
const controllerMiddlewareMap = new WeakMap<Function, MiddlewareDescriptor[]>();

/** WeakMap storing route-level middleware keyed by constructor -> Map<methodName, descriptors>. */
const routeMiddlewareMap = new WeakMap<
  Function,
  Map<string | symbol, MiddlewareDescriptor[]>
>();

/**
 * Sets middleware for a controller class.
 * @param target - The controller class constructor
 * @param middleware - Array of middleware descriptors
 */
export function setControllerMiddleware(
  target: Function,
  middleware: MiddlewareDescriptor[],
): void {
  const existing = controllerMiddlewareMap.get(target) ?? [];
  controllerMiddlewareMap.set(target, [...existing, ...middleware]);
}

/**
 * Gets middleware for a controller class.
 * @param target - The controller class constructor
 * @returns Array of middleware descriptors (empty if none)
 */
export function getControllerMiddleware(
  target: Function,
): MiddlewareDescriptor[] {
  return controllerMiddlewareMap.get(target) ?? [];
}

/**
 * Sets middleware for a specific route method.
 * @param target - The controller class constructor
 * @param methodName - The method name
 * @param middleware - Array of middleware descriptors
 */
export function setRouteMiddleware(
  target: Function,
  methodName: string | symbol,
  middleware: MiddlewareDescriptor[],
): void {
  let methodMap = routeMiddlewareMap.get(target);
  if (!methodMap) {
    methodMap = new Map();
    routeMiddlewareMap.set(target, methodMap);
  }

  const existing = methodMap.get(methodName) ?? [];
  methodMap.set(methodName, [...existing, ...middleware]);
}

/**
 * Gets middleware for a specific route method.
 * @param target - The controller class constructor
 * @param methodName - The method name
 * @returns Array of middleware descriptors (empty if none)
 */
export function getRouteMiddleware(
  target: Function,
  methodName: string | symbol,
): MiddlewareDescriptor[] {
  const methodMap = routeMiddlewareMap.get(target);
  if (!methodMap) {
    return [];
  }
  return methodMap.get(methodName) ?? [];
}
