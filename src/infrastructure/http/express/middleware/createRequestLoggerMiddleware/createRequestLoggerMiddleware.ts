import { NextFunction, Request, Response, RequestHandler } from "express";

import { RequestLoggerMiddlewareDependencies } from "./interfaces/RequestLoggerMiddlewareDependencies.js";
import { EventType } from "../../../../../shared/enums/EventType.js";
import { LogLevel } from "../../../../../shared/enums/LogLevel.js";

export const createRequestLoggerMiddleware = (
  dependencies: RequestLoggerMiddlewareDependencies,
): RequestHandler => {
  const { loggerAdapter } = dependencies;

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on("finish", () => {
      const duration = Date.now() - start;
      const isSuccess = res.statusCode >= 200 && res.statusCode < 300;

      const logLevel = isSuccess ? LogLevel.Info : LogLevel.Error;
      const eventType = isSuccess
        ? EventType.RequestSuccess
        : EventType.RequestError;

      loggerAdapter.writeLog({
        level: logLevel,
        message: `${req.method} ${req.url}`,
        eventType: eventType,
        spanId: `${req.method} ${req.url}`,
        payload: {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          durationMs: duration,
          ip: req.ip,
          userAgent: req.get("User-Agent") || null,
          body: req.body,
        },
      });
    });

    res.on("close", () => {
      if (!res.headersSent) {
        const duration = Date.now() - start;

        loggerAdapter.writeLog({
          level: LogLevel.Warning,
          message: `${req.method} ${req.url}`,
          eventType: EventType.RequestWarning,
          spanId: `${req.method} ${req.url}`,
          payload: {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            durationMs: duration,
            ip: req.ip,
            userAgent: req.get("User-Agent") || null,
            body: req.body,
          },
        });
      }
    });

    next();
  };
};
