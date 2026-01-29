/**
 * Valid synchronous return types from handlers.
 * - Response: Explicit Response object
 * - T: Any serializable value (auto-wrapped as JSON)
 * - void: No content (204)
 * - null: No content (204)
 */
export type HandlerReturnValue<T = unknown> = Response | T | void | null;

/**
 * Valid return types from handlers, including async variants.
 */
export type HandlerReturn<T = unknown> =
  | HandlerReturnValue<T>
  | Promise<HandlerReturnValue<T>>;
