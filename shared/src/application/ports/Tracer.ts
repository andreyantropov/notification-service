export interface Tracer {
  startActiveSpan: <T>(
    name: string,
    options: {
      kind?: "SERVER" | "CLIENT" | "INTERNAL" | "PRODUCER" | "CONSUMER";
      attributes?: Record<string, string | number | boolean>;
    },
    fn: (span: {
      recordException: (error: Error) => void;
      setStatus: (status: { code: "OK" | "ERROR"; message?: string }) => void;
    }) => Promise<T>,
  ) => Promise<T>;
}
