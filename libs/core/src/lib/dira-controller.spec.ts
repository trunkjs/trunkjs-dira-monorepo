import { describe, expect, test } from 'bun:test';
import {
  DiraController,
  getControllerName,
  getControllerPrefix,
  isController,
} from './dira-controller';

describe('DiraController', () => {
  test('stores prefix metadata on class', () => {
    @DiraController('/api')
    class TestController {}

    expect(isController(TestController)).toBe(true);
    expect(getControllerPrefix(TestController)).toBe('/api');
  });

  test('defaults to empty prefix', () => {
    @DiraController()
    class TestController {}

    expect(getControllerPrefix(TestController)).toBe('');
  });

  describe('name option', () => {
    test('stores explicit name in metadata', () => {
      @DiraController('/api', { name: 'api.users' })
      class TestController {}

      expect(getControllerName(TestController)).toBe('api.users');
    });

    test('defaults to class name when name not provided', () => {
      @DiraController('/api')
      class UsersController {}

      expect(getControllerName(UsersController)).toBe('UsersController');
    });

    test('accepts hyphenated names', () => {
      @DiraController('/api', { name: 'api.user-management' })
      class TestController {}

      expect(getControllerName(TestController)).toBe('api.user-management');
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
