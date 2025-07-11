export interface ServerFabric {
  start: () => void;
  stop: () => Promise<void>;
}
