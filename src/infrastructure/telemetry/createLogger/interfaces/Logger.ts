import { type Log } from "./Log.js";

export interface Logger {
  readonly trace: (log: Log) => Promise<void>;
  readonly debug: (log: Log) => Promise<void>;
  readonly info: (log: Log) => Promise<void>;
  readonly warn: (log: Log) => Promise<void>;
  readonly error: (log: Log) => Promise<void>;
  readonly fatal: (log: Log) => Promise<void>;
}
