import { DiraCore } from '@dira/core';
import { EchoController } from './controllers/echo-controller';
import { UsersController } from './controllers/users-controller';
import { FilesController } from './controllers/files-controller';
import { MethodsController } from './controllers/methods-controller';

/**
 * Creates a Dira app with all controllers registered.
 * This is adapter-agnostic - the same app can run on any adapter.
 */
export function createApp(): DiraCore {
  const dira = new DiraCore();

  dira.registerController(new EchoController());
  dira.registerController(new UsersController());
  dira.registerController(new FilesController());
  dira.registerController(new MethodsController());

  return dira;
}
