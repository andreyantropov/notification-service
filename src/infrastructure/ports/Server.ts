export interface Server {
  start: () => void;
  stop: () => Promise<void>;
}
