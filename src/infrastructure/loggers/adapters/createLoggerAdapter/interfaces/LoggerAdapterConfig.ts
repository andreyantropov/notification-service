import { EnvironmentType } from "../../../../../shared/enums/EnvironmentType.js";

export interface LoggerAdapterConfig {
  measurement: string;
  serviceName: string;
  serviceVersion: string;
  environment: EnvironmentType;
}
