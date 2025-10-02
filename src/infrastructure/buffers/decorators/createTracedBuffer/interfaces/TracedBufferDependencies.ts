import { Buffer } from "../../../../../application/ports/Buffer.js";
import { TracingContextManager } from "../../../../ports/TracingContextManager.js";

export interface TracedBufferDependencies<T> {
  buffer: Buffer<T>;
  tracingContextManager: TracingContextManager;
}
