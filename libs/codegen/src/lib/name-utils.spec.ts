import { describe, it, expect } from 'bun:test';
import { toCamelCase, stripControllerSuffix } from './name-utils';

describe('toCamelCase', () => {
  it('should convert hyphenated strings', () => {
    expect(toCamelCase('user-management')).toBe('userManagement');
  });

  it('should convert underscored strings', () => {
    expect(toCamelCase('user_management')).toBe('userManagement');
  });

  it('should lowercase leading uppercase', () => {
    expect(toCamelCase('Posts')).toBe('posts');
  });

  it('should handle PascalCase class names', () => {
    expect(toCamelCase('PostsController')).toBe('postsController');
  });

  it('should handle already camelCase', () => {
    expect(toCamelCase('myItems')).toBe('myItems');
  });

  it('should handle single word lowercase', () => {
    expect(toCamelCase('items')).toBe('items');
  });

  it('should handle multiple consecutive separators', () => {
    expect(toCamelCase('my--thing')).toBe('myThing');
  });
});

describe('stripControllerSuffix', () => {
  it('should strip Controller suffix', () => {
    expect(stripControllerSuffix('PostsController')).toBe('Posts');
  });

  it('should be case-insensitive', () => {
    expect(stripControllerSuffix('Postscontroller')).toBe('Posts');
  });

  it('should not strip if no suffix', () => {
    expect(stripControllerSuffix('Posts')).toBe('Posts');
  });

  it('should handle just Controller', () => {
    expect(stripControllerSuffix('Controller')).toBe('');
  });
});
