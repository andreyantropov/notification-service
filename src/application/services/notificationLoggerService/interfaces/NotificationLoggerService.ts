import { RawLog } from "./RawLog.js";

export interface NotificationLoggerService {
  writeLog: (rawLog: RawLog) => Promise<void>;
}
