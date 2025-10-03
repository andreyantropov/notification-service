import { Buffer } from "../../../../../application/ports/Buffer.js";
import { LoggerAdapter } from "../../../../ports/LoggerAdapter.js";

export interface LoggedBufferDependencies<T> {
  buffer: Buffer<T>;
  loggerAdapter: LoggerAdapter;
}
