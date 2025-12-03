import { Log } from "../types/Log.js";

export interface Logger {
  readonly debug: (log: Log) => Promise<void>;
  readonly info: (log: Log) => Promise<void>;
  readonly warning: (log: Log) => Promise<void>;
  readonly error: (log: Log) => Promise<void>;
  readonly critical: (log: Log) => Promise<void>;
}
