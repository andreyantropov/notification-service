import { NextFunction, Request, Response, RequestHandler } from "express";

import { ActiveRequestsCounterMiddlewareDependencies } from "./interfaces/ActiveRequestsCounterMiddlewareDependencies.js";

export const createActiveRequestsCounterMiddleware = (
  dependencies: ActiveRequestsCounterMiddlewareDependencies,
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
