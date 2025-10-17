import { Log } from "../types/Log.js";

export interface Logger {
  debug: (log: Log) => Promise<void>;
  info: (log: Log) => Promise<void>;
  warning: (log: Log) => Promise<void>;
  error: (log: Log) => Promise<void>;
  critical: (log: Log) => Promise<void>;
}
