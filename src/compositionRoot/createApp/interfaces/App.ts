export interface App {
  readonly start: () => Promise<void>;
  readonly shutdown: () => Promise<void>;
}
