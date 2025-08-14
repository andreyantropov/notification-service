import { Request, Response } from "express";
import { HealthcheckController } from "./interfaces/HealthcheckController.js";
import { NotificationControllerConfig } from "../createNotificationController/index.js";

export const createHealthcheckController = ({
  sendNotificationUseCase,
}: NotificationControllerConfig): HealthcheckController => {
  const live = async (req: Request, res: Response): Promise<void> => {
    res.status(200).send();
  };

  const ready = async (req: Request, res: Response): Promise<void> => {
    try {
      if (sendNotificationUseCase.checkHealth) {
        await sendNotificationUseCase.checkHealth();
      }
      res.status(200).send();
    } catch {
      res.status(503).json({
        error: "HTTP 503 Service Unavailable",
        message: "Сервис недоступен",
      });
    }
  };

  return { live, ready };
};
