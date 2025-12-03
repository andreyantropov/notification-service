export interface TelemetryConfig {
  readonly tracesExporterUrl: string;
  readonly logsExporterUrl: string;
  readonly metricsExporterUrl: string;
}
