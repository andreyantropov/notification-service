import { Logger } from "../../../../../application/ports/Logger.js";
import { Server } from "../../../interfaces/Server.js";

export interface LoggedServerDependencies {
  server: Server;
  logger: Logger;
}
