import { Injectable, Inject } from '@dira/di';
import type { ConfigService } from './config-service';
import type { LoggerService } from './logger-service';

interface User {
  id: string;
  name: string;
  email: string;
}

/**
 * Service with injected dependencies.
 */
@Injectable()
export class UserService {
  @Inject('config') config!: ConfigService;
  @Inject('logger') logger!: LoggerService;

  private readonly instanceId = crypto.randomUUID().slice(0, 8);

  async getUser(id: string): Promise<User | null> {
    this.logger.log(
      `Fetching user ${id} in ${this.config.getConfig().appName}`,
    );

    // Simulated lookup
    if (id === '1') {
      return { id: '1', name: 'John Doe', email: 'john@example.com' };
    }
    return null;
  }

  getInstanceId(): string {
    return this.instanceId;
  }

  getConfigInstanceId(): string {
    return this.config.getInstanceId();
  }

  getLoggerInstanceId(): string {
    return this.logger.getInstanceId();
  }
}
