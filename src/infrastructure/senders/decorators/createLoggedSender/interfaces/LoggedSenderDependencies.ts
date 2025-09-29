import { LoggerAdapter } from "../../../../../application/ports/LoggerAdapter.js";
import { Sender } from "../../../../../domain/ports/Sender.js";

export interface LoggedSenderDependencies {
  sender: Sender;
  loggerAdapter: LoggerAdapter;
}
