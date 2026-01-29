/**
 * Detects whether a decorator is being called in stage 3 or legacy mode.
 *
 * Stage 3 decorators receive (value, context) where context has a 'kind' property.
 * Legacy decorators receive (target, propertyKey, descriptor?).
 *
 * Note: Bun currently uses legacy decorators regardless of tsconfig settings.
 *
 * @param contextOrPropertyKey - Second argument passed to the decorator
 * @returns true if stage 3 decorator mode, false if legacy
 */
export function isStage3Decorator(
  contextOrPropertyKey: unknown,
): contextOrPropertyKey is { kind: string; name: string | symbol } {
  return (
    contextOrPropertyKey !== null &&
    typeof contextOrPropertyKey === 'object' &&
    'kind' in contextOrPropertyKey
  );
}
