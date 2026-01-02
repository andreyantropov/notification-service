import type { Request, Response } from "express";

export interface NotificationController {
  readonly handle: (req: Request, res: Response) => Promise<void>;
}
