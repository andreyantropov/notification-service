import type { Express } from "express";

export interface ServerDependencies {
  readonly app: Express;
}
