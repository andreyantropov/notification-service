import { Log } from "../types/Log.js";

export interface Logger {
  writeLog(log: Log): Promise<void>;
}
