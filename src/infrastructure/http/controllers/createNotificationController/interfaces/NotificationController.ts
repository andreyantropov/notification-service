import { type Request, type Response } from "express";

export interface NotificationController {
  readonly send: (req: Request, res: Response) => Promise<void>;
  readonly sendBatch: (req: Request, res: Response) => Promise<void>;
}
