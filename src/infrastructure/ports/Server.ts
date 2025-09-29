export interface Server {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}
