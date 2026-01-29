import { DiraController, DiraHttp, handler } from '@dira/core';
import type { AppRequest } from '../app-request';

/**
 * Demonstrates dependency injection features via custom request class.
 */
@DiraController('/di', { name: 'di' })
export class DemoController {
  /**
   * Shows @Cached caching - requestId same across calls in same request.
   */
  @DiraHttp('/request-info', { name: 'request-info' })
  requestInfo(req: AppRequest<unknown, unknown, Record<string, string>>): {
    requestId1: string;
    requestId2: string;
    sameRequestId: boolean;
    authToken: string | null;
  } {
    const requestId1 = req.requestId;
    const requestId2 = req.requestId; // Same value due to @Cached

    return {
      requestId1,
      requestId2,
      sameRequestId: requestId1 === requestId2,
      authToken: req.authToken,
    };
  }

  /**
   * Shows async lazy getter with chained dependency.
   */
  @DiraHttp('/current-user', { name: 'current-user' })
  async currentUser(
    req: AppRequest<unknown, unknown, Record<string, string>>,
  ): Promise<{
    user: { id: string; name: string; role: string } | null;
    isAuthenticated: boolean;
  }> {
    const user = await req.currentUser;
    return {
      user,
      isAuthenticated: user !== null,
    };
  }

  /**
   * Shows service instantiation via newInstanceOf with DI.
   */
  @DiraHttp('/services', { name: 'services' })
  services(req: AppRequest<unknown, unknown, Record<string, string>>): {
    loggerInstanceId: string;
    configInstanceId: string;
    userServiceInstanceId: string;
    configFromUserService: string;
  } {
    const logger = req.logger;
    const config = req.config;
    const userService = req.userService;

    logger.log('Services endpoint called');

    return {
      loggerInstanceId: logger.getInstanceId(),
      configInstanceId: config.getInstanceId(),
      userServiceInstanceId: userService.getInstanceId(),
      // UserService has ConfigService injected - verify it's the same instance
      configFromUserService: userService.getConfigInstanceId(),
    };
  }

  /**
   * Shows fetching user via injected UserService.
   */
  @DiraHttp({ name: 'get-user' })
  getUser = handler('/:userId', async (req) => {
    const appReq = req as AppRequest<unknown, unknown, { userId: string }>;
    const user = await appReq.userService.getUser(appReq.params.userId);
    return {
      found: user !== null,
      user,
    };
  });

  /**
   * Shows transient vs singleton service scoping.
   * Logger is transient (new instance each call to newInstanceOf).
   * Config is singleton (same instance within container).
   */
  @DiraHttp('/scopes', { name: 'scopes' })
  scopes(req: AppRequest<unknown, unknown, Record<string, string>>): {
    logger1: string;
    logger2: string;
    sameLogger: boolean;
    config1: string;
    config2: string;
    sameConfig: boolean;
  } {
    // Due to @Cached on the getter, these return the same cached instance
    const logger1 = req.logger.getInstanceId();
    const logger2 = req.logger.getInstanceId();

    const config1 = req.config.getInstanceId();
    const config2 = req.config.getInstanceId();

    return {
      logger1,
      logger2,
      sameLogger: logger1 === logger2, // true - getter cached by @Cached
      config1,
      config2,
      sameConfig: config1 === config2, // true - getter cached by @Cached
    };
  }
}
