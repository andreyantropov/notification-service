import { ErrorRequestHandler, RequestHandler } from "express";

export interface Middleware {
  jsonParser: RequestHandler;
  rateLimitMiddleware: RequestHandler;
  loggerMiddleware: RequestHandler;
  notFoundMiddleware: RequestHandler;
  internalServerErrorMiddleware: ErrorRequestHandler;
}
