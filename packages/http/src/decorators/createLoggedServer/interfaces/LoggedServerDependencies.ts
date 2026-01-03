import type { Server, Logger } from "@notification-platform/shared";

export interface LoggedServerDependencies {
  readonly server: Server;
  readonly logger: Logger;
}
