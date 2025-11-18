import { EnvironmentType } from "../../../../application/enums/index.js";

export interface SDKConfig {
  serviceName: string;
  serviceVersion: string;
  environment: EnvironmentType;
  port: number;
  otelTracesUrl: string;
  otelLogsUrl: string;
  otelMetricsUrl: string;
}
