import { Logger } from "../../../../../application/ports/index.js";
import { Server } from "../../../interfaces/Server.js";

export interface LoggedServerDependencies {
  readonly server: Server;
  readonly logger: Logger;
}
