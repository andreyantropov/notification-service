interface HandlerResult {
    success: boolean;
}

export interface BatchConsumerDependencies<T> {
    handler: (items: T[]) => Promise<HandlerResult[]>;
}