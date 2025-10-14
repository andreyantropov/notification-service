import { Request, Response } from "express";

import { HealthcheckController } from "./interfaces/HealthcheckController.js";
import { HealthCheckDependencies } from "./interfaces/HealthCheckControllerDependencies.js";

export const createHealthcheckController = (
  dependencies: HealthCheckDependencies,
): HealthcheckController => {
  const { sendNotificationUseCase } = dependencies;

  const live = async (req: Request, res: Response): Promise<void> => {
    res.status(200).send();
    return;
  };

  const ready = async (req: Request, res: Response): Promise<void> => {
    try {
      if (sendNotificationUseCase.checkHealth) {
        await sendNotificationUseCase.checkHealth();
      }
      res.status(200).send();
      return;
    } catch {
      res.status(503).json({
        error: "HTTP 503 Service Unavailable",
        message: "Сервис недоступен",
      });
      return;
    }
  };

  return { live, ready };
};
