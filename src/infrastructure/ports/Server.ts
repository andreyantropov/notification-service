export interface Server {
  start: () => Promise<void>;
  shutdown: () => Promise<void>;
}
