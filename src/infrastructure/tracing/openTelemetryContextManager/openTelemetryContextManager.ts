import { context, Context } from "@opentelemetry/api";

import { TracingContextManager } from "../../application/ports/TracingContextManager.js";

export const openTelemetryContextManager: TracingContextManager = {
  active: () => context.active(),
  with: <T>(ctx: unknown, fn: () => Promise<T>): Promise<T> => {
    return context.with(ctx as Context, fn);
  },
};
