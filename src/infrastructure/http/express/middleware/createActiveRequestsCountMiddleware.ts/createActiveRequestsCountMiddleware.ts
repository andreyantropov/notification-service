import { NextFunction, Request, Response, RequestHandler } from "express";

import { ActiveRequestsCountMiddlewareDependencies } from "./interfaces/ActiveRequestsCountMiddlewareDependencies.js";

export const createActiveRequestsCountMiddleware = (
  dependencies: ActiveRequestsCountMiddlewareDependencies,
): RequestHandler => {
  const { activeRequestsCounter } = dependencies;

  return (req: Request, res: Response, next: NextFunction): void => {
    activeRequestsCounter.increase();
    res.on("finish", () => {
      activeRequestsCounter.decrease();
    });

    res.on("close", () => {
      activeRequestsCounter.decrease();
    });

    next();
  };
};
