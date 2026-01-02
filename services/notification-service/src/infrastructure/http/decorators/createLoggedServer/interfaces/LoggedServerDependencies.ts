import type { Logger } from "../../../../../application/ports/index.js";
import type { Server } from "../../../interfaces/Server.js";

export interface LoggedServerDependencies {
  readonly server: Server;
  readonly logger: Logger;
}
