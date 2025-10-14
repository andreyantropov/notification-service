import { NextFunction, Request, Response } from "express";

export interface NotificationController {
  send: (req: Request, res: Response, next: NextFunction) => Promise<void>;
}
