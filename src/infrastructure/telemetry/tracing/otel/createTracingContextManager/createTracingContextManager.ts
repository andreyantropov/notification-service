import {
  trace,
  context,
  SpanKind,
  SpanStatusCode,
  Exception,
  Context,
} from "@opentelemetry/api";

import { TracingContextManagerConfig } from "./interfaces/TracingContextManagerConfig.js";
import { TracingContextManager } from "../../../../ports/TracingContextManager.js";

export const createTracingContextManager = (
  config: TracingContextManagerConfig,
): TracingContextManager => {
  const { serviceName } = config;
  const tracer = trace.getTracer(serviceName);

  const kindMap = {
    SERVER: SpanKind.SERVER,
    CLIENT: SpanKind.CLIENT,
    INTERNAL: SpanKind.INTERNAL,
    PRODUCER: SpanKind.PRODUCER,
    CONSUMER: SpanKind.CONSUMER,
  };

  const statusCodeMap = {
    OK: SpanStatusCode.OK,
    ERROR: SpanStatusCode.ERROR,
  };

  const active = (): Context => context.active();

  const runWithContext = <T>(
    ctx: Context,
    fn: () => Promise<T>,
  ): Promise<T> => {
    return context.with(ctx, fn);
  };

  const getTraceContext = (
    ctx: Context,
  ): {
    traceId: string;
    spanId: string;
  } | null => {
    const span = trace.getSpan(ctx);
    const spanContext = span?.spanContext();
    if (!spanContext) return null;
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
    };
  };

  const startActiveSpan = <T>(
    name: string,
    options: {
      kind?: "SERVER" | "CLIENT" | "INTERNAL" | "PRODUCER" | "CONSUMER";
      attributes?: Record<string, string | number | boolean>;
    },
    fn: (span: {
      recordException: (error: Error) => void;
      setStatus: (status: { code: "OK" | "ERROR"; message?: string }) => void;
    }) => Promise<T>,
  ): Promise<T> => {
    return tracer.startActiveSpan(
      name,
      {
        kind: options.kind ? kindMap[options.kind] : SpanKind.INTERNAL,
        attributes: options.attributes,
      },
      async (otelSpan) => {
        const wrapperSpan = {
          recordException: (error: Error) =>
            otelSpan.recordException(error as Exception),
          setStatus: (status: { code: "OK" | "ERROR"; message?: string }) => {
            otelSpan.setStatus({
              code: statusCodeMap[status.code],
              message: status.message,
            });
          },
        };

        try {
          const result = await fn(wrapperSpan);
          return result;
        } catch (error) {
          wrapperSpan.recordException(error as Error);
          wrapperSpan.setStatus({
            code: "ERROR",
            message: error instanceof Error ? error.message : String(error),
          });
          throw error;
        }
      },
    );
  };

  return {
    active,
    ["with"]: runWithContext,
    getTraceContext,
    startActiveSpan,
  };
};
