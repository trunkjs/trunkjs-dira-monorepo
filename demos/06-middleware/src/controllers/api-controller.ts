import {
  DiraController,
  DiraHttp,
  type DiraHttpRequest,
  UseMiddleware,
} from '@dira/core';
import {
  authMiddleware,
  requireRole,
  type AuthContext,
} from '../middleware/auth-middleware';
import { type LogContext } from '../middleware/logging-middleware';

/** Combined context type from all middleware. */
type RequestContext = AuthContext & LogContext;

/**
 * API controller demonstrating middleware usage.
 * Controller-level middleware (authMiddleware) applies to all routes.
 */
@UseMiddleware(authMiddleware)
@DiraController('/api', { name: 'api' })
export class ApiController {
  /**
   * Public user info - accessible to any authenticated user.
   */
  @DiraHttp('/me', { method: 'GET', name: 'get-me' })
  getMe(req: DiraHttpRequest & { ctx: RequestContext }) {
    return {
      user: req.ctx.user,
      requestId: req.ctx.requestId,
    };
  }

  /**
   * Admin-only endpoint - requires admin role.
   * Method-level middleware adds additional authorization.
   */
  @UseMiddleware(requireRole('admin'))
  @DiraHttp('/admin/stats', { method: 'GET', name: 'admin-stats' })
  getAdminStats(req: DiraHttpRequest & { ctx: RequestContext }) {
    return {
      requestId: req.ctx.requestId,
      stats: {
        totalUsers: 42,
        activeNow: 7,
        requestsToday: 1234,
      },
    };
  }
}
