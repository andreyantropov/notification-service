import { RawLog } from "../types/RawLog.js";

export interface LoggerAdapter {
  debug: (rawLog: RawLog) => Promise<void>;
  info: (rawLog: RawLog) => Promise<void>;
  warning: (rawLog: RawLog) => Promise<void>;
  error: (rawLog: RawLog) => Promise<void>;
  critical: (rawLog: RawLog) => Promise<void>;
}
