import { describe, expect, it } from 'bun:test';
import { validateRouteName } from './validate-route-name';

describe('validateRouteName', () => {
  describe('valid names', () => {
    it('accepts simple alphanumeric names', () => {
      expect(() => validateRouteName('api')).not.toThrow();
      expect(() => validateRouteName('users')).not.toThrow();
      expect(() => validateRouteName('API')).not.toThrow();
      expect(() => validateRouteName('Users123')).not.toThrow();
    });

    it('accepts dot-separated names', () => {
      expect(() => validateRouteName('api.users')).not.toThrow();
      expect(() => validateRouteName('api.users.get')).not.toThrow();
      expect(() => validateRouteName('admin.dashboard.stats')).not.toThrow();
    });

    it('accepts hyphenated names', () => {
      expect(() => validateRouteName('get-by-id')).not.toThrow();
      expect(() => validateRouteName('api.users.get-by-id')).not.toThrow();
      expect(() => validateRouteName('user-management')).not.toThrow();
    });

    it('accepts mixed dots and hyphens', () => {
      expect(() =>
        validateRouteName('api.user-management.get-all'),
      ).not.toThrow();
      expect(() => validateRouteName('v1.auth.sign-in')).not.toThrow();
    });

    it('accepts names with numbers', () => {
      expect(() => validateRouteName('v1')).not.toThrow();
      expect(() => validateRouteName('api.v2.users')).not.toThrow();
      expect(() => validateRouteName('user123.get')).not.toThrow();
    });
  });

  describe('invalid names', () => {
    it('rejects names with spaces', () => {
      expect(() => validateRouteName('api users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api users get')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName(' api')).toThrow(/Invalid route name/);
      expect(() => validateRouteName('api ')).toThrow(/Invalid route name/);
    });

    it('rejects names with special characters', () => {
      expect(() => validateRouteName('api!users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api@users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api#users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api$users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api%users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api&users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api*users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api§§§users')).toThrow(
        /Invalid route name/,
      );
    });

    it('rejects names starting with dot or hyphen', () => {
      expect(() => validateRouteName('.api')).toThrow(/Invalid route name/);
      expect(() => validateRouteName('-api')).toThrow(/Invalid route name/);
    });

    it('rejects names ending with dot or hyphen', () => {
      expect(() => validateRouteName('api.')).toThrow(/Invalid route name/);
      expect(() => validateRouteName('api-')).toThrow(/Invalid route name/);
    });

    it('rejects names with consecutive dots or hyphens', () => {
      expect(() => validateRouteName('api..users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api--users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api.-users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('api-.users')).toThrow(
        /Invalid route name/,
      );
    });

    it('rejects empty names', () => {
      expect(() => validateRouteName('')).toThrow(/Invalid route name/);
    });

    it('rejects names with slashes', () => {
      expect(() => validateRouteName('api/users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('/api')).toThrow(/Invalid route name/);
    });

    it('rejects names with colons', () => {
      expect(() => validateRouteName('api:users')).toThrow(
        /Invalid route name/,
      );
      expect(() => validateRouteName('users:id')).toThrow(/Invalid route name/);
    });
  });
});
