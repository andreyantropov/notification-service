export interface ServerConfig {
  port: number;
  gracefulShutdownTimeout: number;
  onStart?: () => void;
  onStartWarning?: (message: string) => void;
  onStartError?: (error: Error) => void;
  onRuntimeError?: (error: Error) => void;
  onShutdown?: () => void;
  onShutdownWarning?: (message: string) => void;
  onShutdownError?: (error: Error) => void;
}
