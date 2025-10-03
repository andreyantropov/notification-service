export interface ServerConfig {
  port: number;
  gracefulShutdownTimeout: number;
  onStartError?: (error: Error) => void;
  onShutdownError?: (error: Error) => void;
}
