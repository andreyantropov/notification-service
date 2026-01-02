export interface Consumer {
  readonly start: () => Promise<void>;
  readonly shutdown: () => Promise<void>;
  readonly checkHealth?: () => Promise<void>;
}
