import { trace, SpanKind, SpanStatusCode, Exception } from "@opentelemetry/api";

import { TracerConfig } from "./interfaces/index.js";
import { Tracer } from "../../../application/ports/index.js";
import {
  mapKeysToSnakeCase,
  toSnakeCase,
} from "../../../shared/utils/index.js";

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
    const transformedName = toSnakeCase(name);
    const transformedAttributes = mapKeysToSnakeCase(options.attributes);

    return tracer.startActiveSpan(
      transformedName,
      {
        kind: options.kind ? kindMap[options.kind] : SpanKind.INTERNAL,
        attributes: transformedAttributes,
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
