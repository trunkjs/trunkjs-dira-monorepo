import { Injectable } from '@dira/di';

/**
 * Transient service - new instance created each time.
 */
@Injectable()
export class LoggerService {
  private readonly instanceId = crypto.randomUUID().slice(0, 8);

  log(message: string): void {
    console.log(`[Logger ${this.instanceId}] ${message}`);
  }

  getInstanceId(): string {
    return this.instanceId;
  }
}
