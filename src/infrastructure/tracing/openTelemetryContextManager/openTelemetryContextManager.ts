import { context, Context, trace } from "@opentelemetry/api";

import { TracingContextManager } from "../../../application/ports/TracingContextManager.js";

export const openTelemetryContextManager: TracingContextManager = {
  active: () => context.active(),
  with: <T>(ctx: unknown, fn: () => Promise<T>): Promise<T> => {
    return context.with(ctx as Context, fn);
  },
  getTraceContext: (ctx: unknown) => {
    const span = trace.getSpan(ctx as Context);
    const spanContext = span?.spanContext();
    if (!spanContext) return null;
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  },
};
