import { Sender } from "../../../../../domain/ports/Sender.js";
import { LoggerAdapter } from "../../../../ports/LoggerAdapter.js";

export interface LoggedSenderDependencies {
  sender: Sender;
  loggerAdapter: LoggerAdapter;
}
