import { HttpError, type DiraMiddleware } from '@dira/core';

/** Context added by auth middleware. */
export interface AuthContext {
  user: {
    id: string;
    name: string;
    role: 'admin' | 'user';
  };
}

/**
 * Authentication middleware that validates Bearer tokens.
 * Demonstrates:
 * - Short-circuiting (returns 401 without calling next())
 * - Context augmentation (adds user to ctx)
 * - HttpError for typed error responses
 */
export const authMiddleware: DiraMiddleware<
  Record<string, never>,
  AuthContext
> = async (req, next) => {
  const authHeader = req.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new HttpError(401, 'Authentication required', {
      hint: 'Include Authorization: Bearer <token> header',
    });
  }

  const token = authHeader.slice(7);

  // Simple token validation for demo
  // In production, verify JWT or session token
  if (token === 'admin-token') {
    req.ctx.user = { id: '1', name: 'Admin User', role: 'admin' };
  } else if (token === 'user-token') {
    req.ctx.user = { id: '2', name: 'Regular User', role: 'user' };
  } else {
    throw new HttpError(401, 'Invalid token');
  }

  return next();
};

/**
 * Role-based authorization middleware.
 * Must be used after authMiddleware.
 */
export function requireRole(
  role: 'admin' | 'user',
): DiraMiddleware<AuthContext> {
  return async (req, next) => {
    if (req.ctx.user.role !== role && req.ctx.user.role !== 'admin') {
      throw new HttpError(403, 'Forbidden', {
        required: role,
        current: req.ctx.user.role,
      });
    }
    return next();
  };
}
