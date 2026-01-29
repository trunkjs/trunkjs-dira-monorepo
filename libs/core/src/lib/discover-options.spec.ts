import { describe, expect, test } from 'bun:test';
import { DEFAULT_DISCOVER_OPTIONS } from './discover-options';

describe('DiscoverOptions', () => {
  test('default include contains .ts', () => {
    expect(DEFAULT_DISCOVER_OPTIONS.include).toContain('.ts');
  });

  test('default exclude contains .spec.ts and .test.ts', () => {
    expect(DEFAULT_DISCOVER_OPTIONS.exclude).toContain('.spec.ts');
    expect(DEFAULT_DISCOVER_OPTIONS.exclude).toContain('.test.ts');
  });
});
