import { RawLog } from "../types/RawLog.js";

export interface LoggerAdapter {
  writeLog: (rawLog: RawLog) => Promise<void>;
}
