import { Consumer } from "../../../../../../../application/ports/Consumer.js";
import { Logger } from "../../../../../../../application/ports/Logger.js";

export interface LoggedConsumerDependencies {
  consumer: Consumer;
  logger: Logger;
}
