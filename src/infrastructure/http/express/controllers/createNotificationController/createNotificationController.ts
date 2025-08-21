import { Request, Response } from "express";
import { NotificationControllerConfig } from "./interfaces/NotificationControllerConfig.js";
import { NotificationController } from "./interfaces/NotificationController.js";

export const createNotificationController = ({
  sendNotificationUseCase,
}: NotificationControllerConfig): NotificationController => {
  const send = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await sendNotificationUseCase.send(req.validatedBody);

      if (result.errorCount === 0) {
        res.status(201).send();
      } else {
        res.status(207).json({
          message:
            result.successCount === 0
              ? "Не удалось отправить ни одного уведомления"
              : "Уведомления частично отправлены",
          totalCount: result.totalCount,
          successCount: result.successCount,
          errorCount: result.errorCount,
          details: result.results.map((r) => ({
            status: r.success ? "success" : "error",
            recipients: r.notification.recipients,
          })),
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
