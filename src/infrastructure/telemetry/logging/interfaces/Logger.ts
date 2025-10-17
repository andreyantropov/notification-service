import { Log } from "./Log.js";

export interface Logger {
  writeLog(log: Log): Promise<void>;
}
