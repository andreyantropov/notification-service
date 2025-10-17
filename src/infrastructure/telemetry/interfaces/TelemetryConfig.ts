import { EnvironmentType } from "../logging/enums/EnvironmentType.js";

export interface TelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  environment: EnvironmentType;
}
