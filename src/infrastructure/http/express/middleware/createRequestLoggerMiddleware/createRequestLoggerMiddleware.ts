import { NextFunction, Request, Response, RequestHandler } from "express";

import { RequestLoggerMiddlewareDependencies } from "./interfaces/RequestLoggerMiddlewareDependencies.js";
import { EventType } from "../../../../telemetry/logging/enums/EventType.js";

export const createRequestLoggerMiddleware = (
  dependencies: RequestLoggerMiddlewareDependencies,
): RequestHandler => {
  const { logger } = dependencies;

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on("finish", async () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;

      let eventType = EventType.Request;
      let message = `Запрос ${req.method} ${req.url} обработан`;

      switch (statusCode) {
        case 401:
          eventType = EventType.AuthAttempt;
          message = `Требуется аутентификация: ${req.method} ${req.url}`;
          break;
        case 403:
          eventType = EventType.AccessDenied;
          message = `Доступ запрещен: ${req.method} ${req.url}`;
          break;
        case 404:
          message = `Ресурс не найден: ${req.method} ${req.url}`;
          break;
        case 429:
          message = `Слишком много запросов: ${req.method} ${req.url}`;
          break;
        case 500:
        case 502:
        case 503:
          message = `Серверная ошибка: ${req.method} ${req.url}`;
          break;
      }

      const logData = {
        message,
        eventType,
        duration,
        details: {
          method: req.method,
          url: req.url,
          statusCode,
          ip: req.ip,
          userAgent: req.get("User-Agent") || "-",
        },
      };

      if (statusCode >= 200 && statusCode < 500) {
        logger.info(logData);
      } else {
        logger.error(logData);
      }
    });

    res.on("close", async () => {
      if (!res.headersSent) {
        const duration = Date.now() - start;

        logger.warning({
          message: `Запрос ${req.method} ${req.url} был прерван клиентом до завершения обработки`,
          eventType: EventType.Request,
          duration,
          details: {
            method: req.method,
            url: req.url,
            ip: req.ip,
            userAgent: req.get("User-Agent") || "-",
          },
        });
      }
    });

    next();
  };
};
