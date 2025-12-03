import { Request, Response } from "express";
import pTimeout from "p-timeout";

import {
  NotificationController,
  NotificationControllerConfig,
  NotificationControllerDependencies,
  ReceiptBatch,
} from "./interfaces/index.js";
import { IncomingNotificationSchema, SubjectSchema } from "./schemas/index.js";
import { Receipt, ValidationOutcome } from "./types/index.js";
import { IncomingNotification } from "../../../../../application/types/index.js";
import { Subject, Notification } from "../../../../../domain/types/index.js";

const DEFAULT_SEND_TIMEOUT_MS = 60_000;

export const createNotificationController = (
  dependencies: NotificationControllerDependencies,
  config?: NotificationControllerConfig,
): NotificationController => {
  const { handleIncomingNotificationsUseCase } = dependencies;
  const { sendTimeoutMs = DEFAULT_SEND_TIMEOUT_MS } = config ?? {};

  const validateNotificationRequest = (body: unknown): ValidationOutcome => {
    const valid: IncomingNotification[] = [];
    const invalid: { item: unknown; error: unknown }[] = [];

    let items: unknown[];
    if (Array.isArray(body)) {
      items = body;
    } else if (body != null && typeof body === "object") {
      items = [body];
    } else {
      invalid.push({
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
      });
      return { valid, invalid };
    }

    for (const item of items) {
      const result = IncomingNotificationSchema.safeParse(item);
      if (result.success) {
        valid.push(result.data);
      } else {
        invalid.push({
          item,
          error: result.error.errors,
        });
      }
    }

    return { valid, invalid };
  };

  const extractSubjectFromToken = (payload: unknown): Subject => {
    const parsed = SubjectSchema.safeParse(payload);
    if (!parsed.success) {
      throw new Error(
        `Не удалось извлечь данные об отправителе запроса: ${parsed.error.message}`,
      );
    }

    const { sub, preferred_username, name } = parsed.data;
    return {
      id: sub,
      name: preferred_username || name,
    };
  };

  const buildReceiptBatch = (
    accepted: readonly Notification[],
    rejected: readonly { item: unknown; error: unknown }[],
  ): ReceiptBatch => {
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

    const details: Receipt[] = [
      ...accepted.map(
        (elem): Receipt => ({
          success: true,
          notification: elem,
        }),
      ),
      ...rejected.map(
        (elem): Receipt => ({
          success: false,
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

  const send = async (req: Request, res: Response): Promise<void> => {
    const { valid: accepted, invalid: rejected } = validateNotificationRequest(
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

    if (!req.auth) {
      throw new Error(
        `Контроллер вызван без предварительной проверки аутентификации.`,
      );
    }

    const subject = extractSubjectFromToken(req.auth.payload);
    const notifications = accepted.map((item) => ({
      ...item,
      subject,
    }));

    const result = await pTimeout(
      handleIncomingNotificationsUseCase.handle(notifications),
      {
        milliseconds: sendTimeoutMs,
        message: "Превышено время ожидания ответа от внешних систем доставки.",
      },
    );

    const receiptBatch = buildReceiptBatch(result, rejected);

    if (rejected.length === 0) {
      res.status(202).json(receiptBatch);
      return;
    } else {
      res.status(207).json(receiptBatch);
      return;
    }
  };

  return { send };
};
