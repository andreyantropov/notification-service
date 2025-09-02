export interface Buffer<T> {
  append(items: T[]): Promise<void>;
  takeAll(): Promise<T[]>;
}
