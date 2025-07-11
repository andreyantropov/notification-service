import { Request, Response } from "express";

export interface NotificationController {
  send: (req: Request, res: Response) => Promise<void>;
}
