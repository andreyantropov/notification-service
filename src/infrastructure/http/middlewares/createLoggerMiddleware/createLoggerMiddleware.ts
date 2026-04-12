import {
  type NextFunction,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

import { EVENT_TYPE, TRIGGER_TYPE } from "../../../telemetry/index.js";

import {
  ABORTED_STATUS_CODE,
  CLIENT_ERROR,
  SERVER_ERROR,
} from "./constants/index.js";
import { type LoggerMiddlewareDependencies } from "./interfaces/index.js";

export const createLoggerMiddleware = (
  dependencies: LoggerMiddlewareDependencies,
): RequestHandler => {
  const { logger } = dependencies;

  return (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    const logRequest = (isAborted: boolean = false) => {
      const durationMs = Date.now() - start;
      const statusCode = isAborted ? ABORTED_STATUS_CODE : res.statusCode;

      const logData = {
        message: isAborted
          ? "Запрос был прерван клиентом до завершения обработки"
          : "HTTP-запрос завершен",
        eventType: EVENT_TYPE.REQUEST,
        trigger: TRIGGER_TYPE.API,
        durationMs,
        details: {
          method: req.method,
          url: req.url,
          statusCode,
          ...(req.ip ? { ip: req.ip } : {}),
          ...(req.statusMessage ? { statusMessage: req.statusMessage } : {}),
          ...(req.get("User-Agent")
            ? { userAgent: req.get("User-Agent") }
            : {}),
        },
      };

      if (statusCode >= SERVER_ERROR) {
        return logger.error(logData);
      } else if (statusCode >= CLIENT_ERROR || isAborted) {
        return logger.warn(logData);
      } else {
        logger.debug(logData);
      }
    };

    res.on("finish", () => logRequest(false));
    res.on("close", () => {
      if (!res.writableEnded && !res.headersSent) {
        logRequest(true);
      }
    });

    next();
  };
};
