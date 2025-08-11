import { Request, Response } from "express";
import { HealthcheckController } from "./interfaces/HealthcheckController.js";
import { NotificationControllerConfig } from "../createNotificationController/index.js";

export const createHealthcheckController = ({
  sendNotificationUseCase,
}: NotificationControllerConfig): HealthcheckController => {
  /**
   * @openapi
   * /health/live:
   *   get:
   *     summary: Liveness проверка сервиса
   *     description: Проверяет, запущен ли сервис и работает ли он.
   *     tags:
   *       - Healthcheck
   *     responses:
   *       200:
   *         description: Сервис жив
   */
  const live = async (req: Request, res: Response): Promise<void> => {
    res.status(200).send();
  };

  /**
   * @openapi
   * /health/ready:
   *   get:
   *     summary: Readiness проверка сервиса
   *     description: Проверяет, готов ли сервис принимать запросы. Выполняет проверку зависимостей (если они есть).
   *     tags:
   *       - Healthcheck
   *     responses:
   *       200:
   *         description: Сервис готов к работе
   *       503:
   *         description: Сервис временно недоступен
   */
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
