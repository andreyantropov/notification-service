import { EnvironmentType } from "../../../../../shared/enums/EnvironmentType.js";

export interface LoggerAdapterConfig {
  measurement: string;
  currentService: string;
  environment: EnvironmentType;
}
