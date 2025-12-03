export interface Server {
  readonly start: () => Promise<void>;
  readonly shutdown: () => Promise<void>;
}
