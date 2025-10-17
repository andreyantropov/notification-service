import { Log } from "../../../interfaces/Log.js";

export interface FallbackLoggerClientConfig {
  onError?: (details: Log, error: Error) => void;
}
