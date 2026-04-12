import {
  context,
  SpanKind as OtelSpanKind,
  propagation,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";

import { mapKeysToSnakeCase } from "../utils/index.js";

import { type Tracer, type TracerConfig } from "./interfaces/index.js";
import { type SpanKind } from "./types/index.js";

export const createTracer = (config: TracerConfig): Tracer => {
  const { serviceName } = config;
  const tracer = trace.getTracer(serviceName);

  const otelKindMap = {
    SERVER: OtelSpanKind.SERVER,
    CLIENT: OtelSpanKind.CLIENT,
    INTERNAL: OtelSpanKind.INTERNAL,
    PRODUCER: OtelSpanKind.PRODUCER,
    CONSUMER: OtelSpanKind.CONSUMER,
  } as const;

  const startActiveSpan = async <T>(
    name: string,
    fn: () => Promise<T>,
    options: {
      kind?: SpanKind;
      attributes?: Record<string, string>;
    } = {},
  ): Promise<T> => {
    return tracer.startActiveSpan(
      name,
      {
        kind: options.kind ? otelKindMap[options.kind] : OtelSpanKind.INTERNAL,
        attributes: mapKeysToSnakeCase(options.attributes),
      },
      async (otelSpan) => {
        try {
          const result = await fn();
          otelSpan.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (error) {
          const err =
            error instanceof Error
              ? error
              : new Error(String(error), { cause: error });

          otelSpan.recordException(err);
          otelSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: err.message,
          });

          throw error;
        } finally {
          otelSpan.end();
        }
      },
    );
  };

  const continueTrace = async <T>(
    headers: Record<string, string>,
    fn: () => Promise<T>,
  ): Promise<T> => {
    const extractedContext = propagation.extract(context.active(), headers);
    return context.with(extractedContext, fn);
  };

  const getTraceHeaders = (): Record<string, string> => {
    const carrier: Record<string, string> = {};
    propagation.inject(context.active(), carrier);
    return carrier;
  };

  return {
    startActiveSpan,
    continueTrace,
    getTraceHeaders,
  };
};
