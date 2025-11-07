import { Producer } from "../../../../../../../application/ports/Producer.js";
import { Logger } from "../../../../../../ports/Logger.js";

export interface LoggedProducerDependencies<T> {
  producer: Producer<T>;
  logger: Logger;
}
