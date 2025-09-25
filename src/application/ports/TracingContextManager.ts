export interface TracingContextManager {
  active(): unknown;
  with<T>(ctx: unknown, fn: () => Promise<T>): Promise<T>;
}
