import { type Request, type Response } from "express";

export interface HealthController {
  readonly live: (req: Request, res: Response) => Promise<void>;
  readonly ready: (req: Request, res: Response) => Promise<void>;
}
