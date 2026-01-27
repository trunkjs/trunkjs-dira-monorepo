import { describe, expect, test } from 'bun:test';
import { CONTROLLER_PREFIX, DiraController } from './dira-controller';

describe('DiraController', () => {
  test('stores prefix metadata on class', () => {
    @DiraController('/api')
    class TestController {}

    const prefix = Reflect.getMetadata(CONTROLLER_PREFIX, TestController);
    expect(prefix).toBe('/api');
  });

  test('defaults to empty prefix', () => {
    @DiraController()
    class TestController {}

    const prefix = Reflect.getMetadata(CONTROLLER_PREFIX, TestController);
    expect(prefix).toBe('');
  });
});
