import { EnvironmentType } from "@notification-platform/shared";

export interface ServiceConfig {
  readonly name: string;
  readonly version: string;
  readonly environment: EnvironmentType;
  readonly port: number;
}
