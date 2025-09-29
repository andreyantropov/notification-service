import { Buffer } from "../../../../../application/ports/Buffer.js";
import { LoggerAdapter } from "../../../../../application/ports/LoggerAdapter.js";

export interface LoggedBufferDependencies<T> {
  buffer: Buffer<T>;
  loggerAdapter: LoggerAdapter;
}
