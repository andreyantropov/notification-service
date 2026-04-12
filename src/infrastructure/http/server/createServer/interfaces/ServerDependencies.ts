import {
  type ErrorRequestHandler,
  type RequestHandler,
  type Router,
} from "express";

export interface ServerDependencies {
  readonly preHandlers: (ErrorRequestHandler | RequestHandler)[];
  readonly postHandlers: (ErrorRequestHandler | RequestHandler)[];
  readonly router: Router;
}
