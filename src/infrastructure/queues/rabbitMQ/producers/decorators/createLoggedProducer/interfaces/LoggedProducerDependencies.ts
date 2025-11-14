import { Logger } from "../../../../../../../application/ports/Logger.js";
import { Producer } from "../../../../../../../application/ports/Producer.js";

export interface LoggedProducerDependencies<T> {
  producer: Producer<T>;
  logger: Logger;
}
