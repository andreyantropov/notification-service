import { RawLog } from "./RawLog";

export interface NotificationLoggerService {
  writeLog: (rawLog: RawLog) => Promise<void>;
}
