import { LoggerAdapter } from "../../../../application/ports/LoggerAdapter.js";

export const noopLoggerAdapter: LoggerAdapter = {
  writeLog: async () => {},
};
