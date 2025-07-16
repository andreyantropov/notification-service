export interface App {
  start: () => void;
  stop: () => Promise<void>;
}
