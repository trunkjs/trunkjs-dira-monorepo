import { Injectable } from '@dira/di';

interface AppConfig {
  appName: string;
  version: string;
  environment: string;
}

/**
 * Singleton service - same instance reused per container.
 */
@Injectable({ scope: 'singleton' })
export class ConfigService {
  private readonly instanceId = crypto.randomUUID().slice(0, 8);

  private config: AppConfig = {
    appName: 'DI Demo',
    version: '1.0.0',
    environment: 'development',
  };

  getConfig(): AppConfig {
    return this.config;
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}
