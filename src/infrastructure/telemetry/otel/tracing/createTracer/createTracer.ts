import { trace, SpanKind, SpanStatusCode, Exception } from "@opentelemetry/api";

import { TracerConfig } from "./interfaces/TracerConfig.js";
import { Tracer } from "../../../../../application/ports/Tracer.js";

export const createTracer = (config: TracerConfig): Tracer => {
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

  const startActiveSpan = async <T>(
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
        const wrapper = {
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
          return await fn(wrapper);
        } catch (err) {
          wrapper.recordException(err as Error);
          wrapper.setStatus({
            code: "ERROR",
            message: (err as Error)?.message ?? String(err),
          });
          throw err;
        }
      },
    );
  };

  return {
    startActiveSpan,
  };
};
