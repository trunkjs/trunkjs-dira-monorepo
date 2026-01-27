import type { HttpHandler } from './http-handler';

export interface RouteRegistration {
  route: string;
  handler: HttpHandler;
}
