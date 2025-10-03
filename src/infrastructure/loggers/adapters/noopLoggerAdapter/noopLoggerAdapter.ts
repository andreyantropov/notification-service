import { LoggerAdapter } from "../../../ports/LoggerAdapter.js";

export const noopLoggerAdapter: LoggerAdapter = {
  debug: async () => {},
  info: async () => {},
  warning: async () => {},
  error: async () => {},
  critical: async () => {},
};
