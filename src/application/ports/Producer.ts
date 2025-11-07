export interface Producer<T> {
  start: () => Promise<void>;
  publish: (items: T[]) => Promise<void>;
  shutdown: () => Promise<void>;
  checkHealth?: () => Promise<void>;
}
