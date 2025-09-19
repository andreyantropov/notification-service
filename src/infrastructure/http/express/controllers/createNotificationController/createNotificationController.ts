import { Request, Response } from "express";
import z from "zod";

import { NotificationController } from "./interfaces/NotificationController.js";
import { NotificationControllerDependencies } from "./interfaces/NotificationControllerDependencies.js";
import { SendResponse } from "./interfaces/SendResponse.js";
import { ParsedNotificationResult } from "./types/ParsedNotificationResult.js";
import { SendResult } from "./types/SendResult.js";
import {
  SingleNotification,
  NotificationRequest,
} from "../../../../../api/schemas/NotificationRequest.js";
import { Notification } from "../../../../../domain/types/Notification.js";

export const createNotificationController = (
  dependencies: NotificationControllerDependencies,
): NotificationController => {
  const { sendNotificationUseCase } = dependencies;

  const parseNotificationRequest = (
    body: unknown,
  ): ParsedNotificationResult => {
    const valid: z.infer<typeof SingleNotification>[] = [];
    const invalid: { item: unknown; error: unknown }[] = [];

    const result = NotificationRequest.safeParse(body);

    if (result.success) {
      const data = result.data;
      valid.push(...(Array.isArray(data) ? data : [data]));
      return { valid, invalid };
    }

    let items: unknown[];

    if (Array.isArray(body)) {
      items = body;
    } else if (body && typeof body === "object") {
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
      const singleResult = SingleNotification.safeParse(item);
      if (singleResult.success) {
        valid.push(singleResult.data);
      } else {
        invalid.push({
          item,
          error: singleResult.error.errors,
        });
      }
    }

    return { valid, invalid };
  };

  const formatSendResponse = (
    valid: Notification[],
    invalid: { item: unknown; error: unknown }[],
  ): SendResponse => {
    const validCount = valid.length;
    const invalidCount = invalid.length;
    const totalCount = valid.length + invalid.length;

    let message = "";
    if (invalidCount === 0) {
      message = "Все уведомления приняты в обработку";
    } else if (validCount === 0) {
      message = "Ни одно уведомление не прошло валидацию";
    } else {
      message = `Уведомления приняты частично: ${validCount} принято, ${invalidCount} отклонено`;
    }

    const details: SendResult[] = [
      ...valid.map(
        (elem): SendResult => ({
          success: true,
          notification: elem,
        }),
      ),
      ...invalid.map(
        (elem): SendResult => ({
          success: false,
          notification: elem.item,
          error: elem.error,
        }),
      ),
    ];

    return {
      message,
      totalCount,
      validCount,
      invalidCount,
      details,
    };
  };

  const send = async (req: Request, res: Response): Promise<void> => {
    try {
      const { valid, invalid } = parseNotificationRequest(req.body);

      if (valid.length === 0) {
        res.status(400).json({
          error: "HTTP 400 Bad Request",
          message: "Ни одно уведомление не прошло валидацию",
          details: invalid,
        });
        return;
      }

      await sendNotificationUseCase.send(valid);

      const sendResult = formatSendResponse(valid, invalid);

      if (invalid.length === 0) {
        res.status(202).send();
      } else {
        res.status(207).json(sendResult);
      }
    } catch {
      res.status(500).json({
        error: "HTTP 500 Internal Server Error",
        message: "Не удалось отправить уведомление",
      });
    }
  };

  return { send };
};
