import { Log } from "../../../types/Log.js";

export interface FallbackLoggerClientConfig {
  onError?: (payload: Log, error: Error) => void;
}
