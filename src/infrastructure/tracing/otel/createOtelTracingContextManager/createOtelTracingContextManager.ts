import {
  trace,
  context,
  SpanKind,
  SpanStatusCode,
  Exception,
  Context,
} from "@opentelemetry/api";

import { OtelTracingContextManagerConfig } from "./interfaces/OtelTracingContextManagerConfig.js";
import { TracingContextManager } from "../../../../application/ports/TracingContextManager.js";

export const createOtelTracingContextManager = (
  config: OtelTracingContextManagerConfig,
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

  return {
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
    startActiveSpan: async <T>(
      name: string,
      options: {
        kind?: "SERVER" | "CLIENT" | "INTERNAL" | "PRODUCER" | "CONSUMER";
        attributes?: Record<string, string | number | boolean>;
      },
      fn: (span: {
        end: () => void;
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
            end: () => otelSpan.end(),
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
          } finally {
            wrapperSpan.end();
          }
        },
      );
    },
  };
};
