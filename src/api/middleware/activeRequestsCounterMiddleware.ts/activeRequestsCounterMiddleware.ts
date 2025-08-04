import { NextFunction, Request, Response, RequestHandler } from "express";
import { ActiveRequestsCounter } from "./interfaces/ActiveRequestsCounter.js";

export const createActiveRequestsCounterMiddleware = (
  activeRequestsCounter: ActiveRequestsCounter,
): RequestHandler => {
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
