import { Request, Response } from "express";

export interface NotificationController {
  readonly send: (req: Request, res: Response) => Promise<void>;
}
