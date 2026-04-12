import { type SpanKind } from "../types/index.js";

export interface Tracer {
  readonly startActiveSpan: <T>(
    name: string,
    fn: () => Promise<T>,
    options?: {
      kind?: SpanKind;
      attributes?: Record<string, string>;
    },
  ) => Promise<T>;
  readonly continueTrace: <T>(
    headers: Record<string, string>,
    fn: () => Promise<T>,
  ) => Promise<T>;
  readonly getTraceHeaders: () => Record<string, string>;
}
