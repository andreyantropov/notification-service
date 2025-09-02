import { NextFunction, Request, Response, RequestHandler } from "express";
import { Counter } from "../../../../ports/Counter.js";

export const createActiveRequestsCounterMiddleware = (
  activeRequestsCounter: Counter,
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
