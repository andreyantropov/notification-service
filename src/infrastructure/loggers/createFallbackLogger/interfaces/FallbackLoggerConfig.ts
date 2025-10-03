import { Log } from "../../../types/Log.js";

export interface FallbackLoggerClientConfig {
  onError?: (details: Log, error: Error) => void;
}
