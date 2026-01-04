import type { Request, Response } from "express";

export interface HealthcheckController {
  readonly live: (req: Request, res: Response) => Promise<void>;
  readonly ready: (req: Request, res: Response) => Promise<void>;
}
