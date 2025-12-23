import type { Request, Response } from "express";
import pTimeout from "p-timeout";

import { DEFAULT_READY_TIMEOUT_MS } from "./constants/index.js";
import type {
  HealthcheckController,
  HealthcheckControllerConfig,
  HealthCheckDependencies,
} from "./interfaces/index.js";

export const createHealthcheckController = (
  dependencies: HealthCheckDependencies,
  config?: HealthcheckControllerConfig,
): HealthcheckController => {
  const { checkHealthUseCase } = dependencies;
  const { readyTimeoutMs = DEFAULT_READY_TIMEOUT_MS } = config ?? {};

  const live = async (req: Request, res: Response): Promise<void> => {
    res.status(200).send();
    return;
  };

  const ready = async (req: Request, res: Response): Promise<void> => {
    try {
      await pTimeout(checkHealthUseCase.checkHealth(), {
        milliseconds: readyTimeoutMs,
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
