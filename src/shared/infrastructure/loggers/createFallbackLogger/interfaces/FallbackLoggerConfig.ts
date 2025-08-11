import { Log } from "../../../../../shared/interfaces/Log.js";

export interface FallbackLoggerClientConfig {
  onError?: (payload: Log, error: Error) => void;
}
