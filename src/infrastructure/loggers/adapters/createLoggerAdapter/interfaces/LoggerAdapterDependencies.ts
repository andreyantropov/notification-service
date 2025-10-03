import { TracingContextManager } from "../../../../ports/TracingContextManager.js";
import { Logger } from "../../../../ports/Logger.js";

export interface LoggerAdapterDependencies {
  logger: Logger;
  tracingContextManager: TracingContextManager;
}
