import { Log } from "../../../../../shared/interfaces/Log";
import { Logger } from "../../../../interfaces/Logger";

export interface FallbackLoggerClientConfig {
  loggers: Logger[];
  onError?: (payload: Log, error: Error) => void;
}
