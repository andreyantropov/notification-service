import { type Request, type Response } from "express";

import {
  type HealthController,
  type HealthControllerDependencies,
} from "./interfaces/index.js";

export const createHealthController = (
  dependencies: HealthControllerDependencies,
): HealthController => {
  const { checkLivenessUseCase, checkReadinessUseCase } = dependencies;

  const live = async (req: Request, res: Response): Promise<void> => {
    try {
      await checkLivenessUseCase.execute();
      res.status(200).send();
    } catch {
      res.status(503).json({
        message: "Сервис временно недоступен",
      });
    }
  };

  const ready = async (req: Request, res: Response): Promise<void> => {
    try {
      await checkReadinessUseCase.execute();
      res.status(200).send();
    } catch {
      res.status(503).json({
        message: "Сервис временно недоступен",
      });
    }
  };

  return { live, ready };
};
