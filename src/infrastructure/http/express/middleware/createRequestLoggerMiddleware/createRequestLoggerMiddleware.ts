import { NextFunction, Request, Response, RequestHandler } from "express";

import { RequestLoggerMiddlewareDependencies } from "./interfaces/RequestLoggerMiddlewareDependencies.js";
import { EventType } from "../../../../../shared/enums/EventType.js";

export const createRequestLoggerMiddleware = (
  dependencies: RequestLoggerMiddlewareDependencies,
): RequestHandler => {
  const { loggerAdapter } = dependencies;

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on("finish", async () => {
      const duration = Date.now() - start;

      const isSuccess = res.statusCode >= 200 && res.statusCode < 500;

      if (isSuccess) {
        await loggerAdapter.info({
          message: `Запрос ${req.method} ${req.url} обработан`,
          eventType: EventType.Request,
          duration,
          details: {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            ip: req.ip,
            userAgent: req.get("User-Agent") || "-",
          },
        });
      } else {
        await loggerAdapter.error({
          message: `Не удалось обработать запрос ${req.method} ${req.url}`,
          eventType: EventType.Request,
          duration,
          details: {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            ip: req.ip,
            userAgent: req.get("User-Agent") || "-",
          },
        });
      }
    });

    res.on("close", async () => {
      if (!res.headersSent) {
        const duration = Date.now() - start;

        await loggerAdapter.warning({
          message: `Запрос ${req.method} ${req.url} был прерван клиентом до завершения обработки`,
          eventType: EventType.Request,
          duration,
          details: {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            ip: req.ip,
            userAgent: req.get("User-Agent") || "-",
          },
        });
      }
    });

    next();
  };
};
