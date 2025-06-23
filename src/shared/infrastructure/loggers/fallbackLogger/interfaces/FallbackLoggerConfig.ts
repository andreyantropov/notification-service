import { Log } from "../../../../../shared/interfaces/Log.js";
import { Logger } from "../../../../interfaces/Logger.js";

export interface FallbackLoggerClientConfig {
  loggers: Logger[];
  onError?: (payload: Log, error: Error) => void;
}
