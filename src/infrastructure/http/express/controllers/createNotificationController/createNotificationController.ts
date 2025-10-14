import { NextFunction, Request, Response } from "express";
import z from "zod";

import { NotificationController } from "./interfaces/NotificationController.js";
import { NotificationControllerDependencies } from "./interfaces/NotificationControllerDependencies.js";
import { SendResponse } from "./interfaces/SendResponse.js";
import { ParsedNotificationResult } from "./types/ParsedNotificationResult.js";
import { SendResult } from "./types/SendResult.js";
import { Notification } from "../../../../../domain/types/Notification.js";
import { SingleNotification, TokenPayload } from "../../../schemas/index.js";
import { NotificationRequest } from "../../../schemas/NotificationRequest.js";

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

  const extractSenderFromToken = (payload: unknown) => {
    const parsed = TokenPayload.safeParse(payload);
    if (!parsed.success) {
      throw new Error(
        `Не удалось извлечь данные об отправителе запроса: ${parsed.error.message}`,
      );
    }

    const { sub, preferred_username, name } = parsed.data;
    return {
      id: sub,
      name: preferred_username || name || undefined,
    };
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

  const send = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
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

      if (!req.auth) {
        throw new Error(
          `Контроллер вызван без предварительной проверки аутентификации.`,
        );
      }

      const subject = extractSenderFromToken(req.auth.payload);
      const notifications = valid.map((item) => ({
        ...item,
        subject,
      }));

      const result = await sendNotificationUseCase.send(notifications);

      const sendResult = formatSendResponse(result, invalid);

      if (invalid.length === 0) {
        res.status(202).json(sendResult);
        return;
      } else {
        res.status(207).json(sendResult);
        return;
      }
    } catch (error) {
      next(error);
    }
  };

  return { send };
};
