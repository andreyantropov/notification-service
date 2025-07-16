import { Request, RequestHandler, Response } from "express";
import { HttpMethod } from "../../../enum/HttpMethod.js";

export interface RouterFabricConfig {
  method: HttpMethod;
  path: string;
  controller: (req: Request, res: Response) => Promise<void>;
  validate?: RequestHandler;
}
