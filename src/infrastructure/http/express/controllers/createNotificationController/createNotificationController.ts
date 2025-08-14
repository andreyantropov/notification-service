import { Request, Response } from "express";
import { NotificationControllerConfig } from "./interfaces/NotificationControllerConfig.js";
import { NotificationController } from "./interfaces/NotificationController.js";

export const createNotificationController = ({
  sendNotificationUseCase,
}: NotificationControllerConfig): NotificationController => {
  const send = async (req: Request, res: Response): Promise<void> => {
    try {
      await sendNotificationUseCase.send(req.validatedBody);
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
