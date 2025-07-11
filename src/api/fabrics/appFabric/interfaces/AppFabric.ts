export interface AppFabric {
  start: () => void;
  stop: () => Promise<void>;
}
