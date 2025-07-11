import { Request, RequestHandler, Response } from "express";

export interface NotificationRouterConfig {
  path: string;
  validate: RequestHandler;
  handler: (req: Request, res: Response) => Promise<void>;
}
