import { Request, Response } from "express";
import { NotificationControllerConfig } from "./interfaces/NotificationControllerConfig.js";
import { NotificationController } from "./interfaces/NotificationController.js";
import z from "zod";
import {
  SingleNotification,
  NotificationRequest,
} from "../../../../../api/schemas/NotificationRequest.js";
import { SendResponse } from "./interfaces/SendResponse.js";
import { ParsedNotificationResult } from "./types/ParsedNotificationResult.js";
import { SendResult } from "./types/SendResult.js";

export const createNotificationController = ({
  sendNotificationUseCase,
}: NotificationControllerConfig): NotificationController => {
  const parseNotificationRequest = (
    body: unknown,
  ): ParsedNotificationResult => {
    const valid: z.infer<typeof SingleNotification>[] = [];
    const invalid: { item: unknown; error: z.ZodIssue[] }[] = [];

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
    valid: z.infer<typeof SingleNotification>[],
    invalid: { item: unknown; error: z.ZodIssue[] }[],
    deliveryResults: SendResult[],
  ): SendResponse => {
    const successful = deliveryResults.filter((r) => r.success);
    const failedInDelivery = deliveryResults.filter((r) => !r.success);

    const successCount = successful.length;
    const deliveryErrorCount = failedInDelivery.length;
    const validationErrorCount = invalid.length;
    const totalCount = valid.length + invalid.length;

    const details = [
      ...successful.map((r) => ({
        status: "success" as const,
        notification: r.notification,
      })),
      ...failedInDelivery.map((r) => ({
        status: "error" as const,
        notification: r.notification,
        error: r.error ?? "Unknown delivery error",
      })),
      ...invalid.map((err) => ({
        status: "error" as const,
        notification: err.item,
        message:
          "Некорректная структура уведомления. Исправьте данные и повторите запрос.",
        errors: err.error,
      })),
    ];

    return {
      message:
        successCount === 0
          ? "Не удалось отправить ни одного уведомления"
          : "Уведомления частично отправлены",
      totalCount,
      successCount,
      validationErrorCount,
      deliveryErrorCount,
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

      const result = await sendNotificationUseCase.send(valid);

      const {
        successCount,
        deliveryErrorCount,
        validationErrorCount,
        totalCount,
        details,
      } = formatSendResponse(valid, invalid, result);

      if (successCount === totalCount) {
        res.status(201).send();
      } else {
        res.status(207).json({
          message:
            successCount === 0
              ? "Не удалось отправить ни одного уведомления"
              : "Уведомления частично отправлены",
          totalCount,
          successCount,
          validationErrorCount,
          deliveryErrorCount,
          details,
        });
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
