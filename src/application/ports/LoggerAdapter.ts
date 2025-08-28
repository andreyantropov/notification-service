import { RawLog } from "./RawLog.js";

export interface LoggerAdapter {
  writeLog: (rawLog: RawLog) => Promise<void>;
}
