import { Buffer } from "../../../../../application/ports/Buffer.js";
import { Logger } from "../../../../ports/Logger.js";

export interface LoggedBufferDependencies<T> {
  buffer: Buffer<T>;
  logger: Logger;
}
