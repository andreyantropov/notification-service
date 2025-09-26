import { TracingContextManager } from "../../../../application/ports/TracingContextManager.js";
import { Sender } from "../../../../domain/ports/Sender.js";

export interface TrasedSenderDependencies {
  sender: Sender;
  tracingContextManager: TracingContextManager;
}
