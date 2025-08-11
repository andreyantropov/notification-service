export interface ServerConfig {
  port: number;
  gracefulShutdownTimeout: number;
  onStartError?: (error: Error) => void;
  onStopError?: (error: Error) => void;
}
