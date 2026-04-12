import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

import { ABORTED_STATUS_CODE } from "./constants/index.js";
import { type MeterMiddlewareDependencies } from "./interfaces/index.js";

export const createMeterMiddleware = (
  dependencies: MeterMiddlewareDependencies,
): RequestHandler => {
  const { meter } = dependencies;

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    const recordMetrics = (status: number) => {
      const durationMs = Date.now() - start;
      const labels = { statusCode: status };

      meter.increment("http_requests_total", labels);
      meter.record("http_requests_duration_ms", durationMs, labels);
    };

    res.on("finish", () => recordMetrics(res.statusCode));
    res.on("close", () => {
      if (!res.writableEnded && !res.headersSent) {
        recordMetrics(ABORTED_STATUS_CODE);
      }
    });

    next();
  };
};
