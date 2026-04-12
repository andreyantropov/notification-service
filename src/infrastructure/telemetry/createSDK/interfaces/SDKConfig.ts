export interface SDKConfig {
  readonly name: string;
  readonly version: string;
  readonly environment: string;
  readonly port: number;
  readonly exporters: {
    readonly tracesExporterUrl?: string;
    readonly logsExporterUrl?: string;
    readonly metricsExporterUrl?: string;
  };
}
