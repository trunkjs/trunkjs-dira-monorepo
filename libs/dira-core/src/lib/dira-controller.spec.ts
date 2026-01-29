import { describe, expect, test } from 'bun:test';
import {
  CONTROLLER_NAME,
  CONTROLLER_PREFIX,
  DiraController,
} from './dira-controller';

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

  describe('name option', () => {
    test('stores explicit name in metadata', () => {
      @DiraController('/api', { name: 'api.users' })
      class TestController {}

      const name = Reflect.getMetadata(CONTROLLER_NAME, TestController);
      expect(name).toBe('api.users');
    });

    test('defaults to class name when name not provided', () => {
      @DiraController('/api')
      class UsersController {}

      const name = Reflect.getMetadata(CONTROLLER_NAME, UsersController);
      expect(name).toBe('UsersController');
    });

    test('accepts hyphenated names', () => {
      @DiraController('/api', { name: 'api.user-management' })
      class TestController {}

      const name = Reflect.getMetadata(CONTROLLER_NAME, TestController);
      expect(name).toBe('api.user-management');
    });

    test('throws for invalid name with spaces', () => {
      expect(() => {
        @DiraController('/api', { name: 'api users' })
        class TestController {}
      }).toThrow(/Invalid route name/);
    });

    test('throws for invalid name with special characters', () => {
      expect(() => {
        @DiraController('/api', { name: 'api!users' })
        class TestController {}
      }).toThrow(/Invalid route name/);
    });
  });
});
