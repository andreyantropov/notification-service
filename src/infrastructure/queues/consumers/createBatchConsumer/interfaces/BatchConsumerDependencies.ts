import type { HandlerResult } from "./HandlerResult.js";

export interface BatchConsumerDependencies<T> {
  handler: (items: readonly T[]) => Promise<HandlerResult[]>;
}
