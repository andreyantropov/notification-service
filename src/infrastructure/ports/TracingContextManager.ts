export interface TracingContextManager {
  active(): unknown;
  with<T>(ctx: unknown, fn: () => Promise<T>): Promise<T>;
  getTraceContext(ctx: unknown): { traceId?: string; spanId?: string } | null;
  startActiveSpan<T>(
    name: string,
    options: {
      kind?: "SERVER" | "CLIENT" | "INTERNAL" | "PRODUCER" | "CONSUMER";
      attributes?: Record<string, string | number | boolean>;
    },
    fn: (span: {
      recordException: (error: Error) => void;
      setStatus: (status: { code: "OK" | "ERROR"; message?: string }) => void;
    }) => Promise<T>,
  ): Promise<T>;
}
