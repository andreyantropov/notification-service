/**
 * @openapi
 * /v1/notifications:
 *   post:
 *     summary: Отправка уведомления
 *     tags:
 *       - Notifications
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NotificationRequest'
 *     responses:
 *       201:
 *         description: Уведомление успешно отправлено
 *       400:
 *         description: Некорректное тело запроса
 *       500:
 *         description: Внутренняя ошибка сервера
 */

import { Request, Response } from "express";
import { NotificationControllerConfig } from "./interfaces/NotificationControllerConfig.js";
import { NotificationController } from "./interfaces/NotificationController.js";

export const createNotificationController = ({
  sendNotificationUseCase,
}: NotificationControllerConfig): NotificationController => {
  const send = async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipients, message } = req.body;

      await sendNotificationUseCase.send({ recipients, message });
      res.status(201).send();
    } catch {
      res.status(500).json({
        error: "HTTP 500 Internal Server Error",
        message: "Не удалось отправить уведомление",
      });
    }
  };

  return { send };
};
