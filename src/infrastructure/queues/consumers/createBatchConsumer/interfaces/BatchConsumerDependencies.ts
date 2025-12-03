interface HandlerResult {
  readonly success: boolean;
}

export interface BatchConsumerDependencies<T> {
  handler: (items: readonly T[]) => Promise<HandlerResult[]>;
}
