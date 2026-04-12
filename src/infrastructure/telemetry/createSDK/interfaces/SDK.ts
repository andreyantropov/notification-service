export interface SDK {
  readonly start: () => Promise<void>;
  readonly shutdown: () => Promise<void>;
}
