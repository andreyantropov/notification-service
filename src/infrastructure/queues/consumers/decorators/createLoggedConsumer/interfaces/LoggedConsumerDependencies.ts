import { Consumer, Logger } from "../../../../../../application/ports/index.js";

export interface LoggedConsumerDependencies {
  readonly consumer: Consumer;
  readonly logger: Logger;
}
