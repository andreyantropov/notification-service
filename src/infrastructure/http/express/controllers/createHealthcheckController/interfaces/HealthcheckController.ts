import { Request, Response } from "express";

export interface HealthcheckController {
  live: (req: Request, res: Response) => Promise<void>;
  ready: (req: Request, res: Response) => Promise<void>;
}
