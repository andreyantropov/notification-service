import { Request, Response } from "express";
import pTimeout from "p-timeout";

import { HealthcheckController } from "./interfaces/HealthcheckController.js";
import { HealthCheckDependencies } from "./interfaces/HealthCheckControllerDependencies.js";

const DEFAULT_READY_TIMEOUT = 5_000;

export const createHealthcheckController = (
  dependencies: HealthCheckDependencies,
): HealthcheckController => {
  const { checkNotificationServiceHealthUseCase } = dependencies;

  const live = async (req: Request, res: Response): Promise<void> => {
    res.status(200).send();
    return;
  };

  const ready = async (req: Request, res: Response): Promise<void> => {
    try {
      await pTimeout(checkNotificationServiceHealthUseCase.checkHealth(), {
        milliseconds: DEFAULT_READY_TIMEOUT,
        message: "Превышено время ожидания проверки готовности сервиса",
      });
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
