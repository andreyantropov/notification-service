import { Producer, Logger } from "../../../../../../application/ports/index.js";

export interface LoggedProducerDependencies<T> {
  readonly producer: Producer<T>;
  readonly logger: Logger;
}
