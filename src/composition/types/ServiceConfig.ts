import { EnvironmentType } from "../../application/enums/index.js";

export interface ServiceConfig {
  readonly name: string;
  readonly version: string;
  readonly environment: EnvironmentType;
  readonly port: number;
  readonly publicUrl: string;
  readonly title: string;
  readonly description?: string;
}
