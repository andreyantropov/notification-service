import type { Request, Response } from "express";
import pTimeout from "p-timeout";

import { DEFAULT_SEND_TIMEOUT_MS } from "./constants/index.js";
import type {
  NotificationController,
  NotificationControllerConfig,
  NotificationControllerDependencies,
  ResponseBody,
} from "./interfaces/index.js";
import { IncomingNotificationSchema } from "./schemas/index.js";
import type { Detail } from "./types/index.js";
import type { IncomingNotification } from "../../../../application/types/index.js";
import type { Notification } from "@notification-platform/shared";
import { extractSubjectFromToken, validateBatch } from "./utils/index.js";
import type { ValidationError, ValidationResult } from "./utils/index.js";

export const createNotificationController = (
  dependencies: NotificationControllerDependencies,
  config?: NotificationControllerConfig,
): NotificationController => {
  const { handleIncomingNotificationsUseCase } = dependencies;
  const { sendTimeoutMs = DEFAULT_SEND_TIMEOUT_MS } = config ?? {};

  const validateRequestBody = (
    body: unknown,
  ): ValidationResult<IncomingNotification> => {
    let items: unknown[];
    if (Array.isArray(body)) {
      items = body;
    } else if (body != null && typeof body === "object") {
      items = [body];
    } else {
      return {
        valid: [],
        invalid: [
          {
            item: body,
            error: [
              {
                code: "invalid_type",
                message: "Ожидается объект или массив объектов уведомлений",
                path: [],
                expected: "object",
                received: typeof body,
              },
            ],
          },
        ],
      };
    }

    return validateBatch(items, IncomingNotificationSchema);
  };

  const buildResponseBody = (
    accepted: readonly Notification[],
    rejected: readonly ValidationError[],
  ): ResponseBody => {
    const acceptedCount = accepted.length;
    const rejectedCount = rejected.length;
    const totalCount = accepted.length + rejected.length;

    let message = "";
    if (rejectedCount === 0) {
      message = "Все уведомления приняты в обработку";
    } else if (acceptedCount === 0) {
      message = "Ни одно уведомление не прошло валидацию";
    } else {
      message = `Уведомления приняты частично: ${acceptedCount} принято, ${rejectedCount} отклонено`;
    }

    const details: Detail[] = [
      ...accepted.map(
        (elem): Detail => ({
          status: "success",
          notification: elem,
        }),
      ),
      ...rejected.map(
        (elem): Detail => ({
          status: "failure",
          notification: elem.item,
          error: elem.error,
        }),
      ),
    ];

    return {
      message,
      totalCount,
      acceptedCount,
      rejectedCount,
      details,
    };
  };

  const handle = async (req: Request, res: Response): Promise<void> => {
    const { valid: accepted, invalid: rejected } = validateRequestBody(
      req.body,
    );

    if (accepted.length === 0) {
      res.status(400).json({
        error: "HTTP 400 Bad Request",
        message: "Ни одно уведомление не прошло валидацию",
        details: rejected,
      });
      return;
    }

    const subject = req.auth
      ? extractSubjectFromToken(req.auth.payload)
      : undefined;

    const result = await pTimeout(
      handleIncomingNotificationsUseCase.handle(accepted, subject),
      {
        milliseconds: sendTimeoutMs,
        message: "Превышено время ожидания ответа от внешних систем доставки.",
      },
    );

    const body = buildResponseBody(result, rejected);

    if (rejected.length === 0) {
      res.status(202).json(body);
      return;
    } else {
      res.status(207).json(body);
      return;
    }
  };

  return { handle };
};
