import { Sender } from "../../../../../domain/ports/Sender.js";
import { TracingContextManager } from "../../../../ports/TracingContextManager.js";

export interface TrasedSenderDependencies {
  sender: Sender;
  tracingContextManager: TracingContextManager;
}
