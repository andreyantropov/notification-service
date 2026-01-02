export interface Producer<T> {
  readonly start: () => Promise<void>;
  readonly publish: (items: readonly T[]) => Promise<void>;
  readonly shutdown: () => Promise<void>;
  readonly checkHealth?: () => Promise<void>;
}
