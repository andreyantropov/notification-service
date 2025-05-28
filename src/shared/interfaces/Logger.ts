import { Log } from "./Log";

export interface Logger {
  writeLog(log: Log): Promise<void>;
}
