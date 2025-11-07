export interface Consumer {
  start: () => Promise<void>;
  shutdown: () => Promise<void>;
  checkHealth?: () => Promise<void>;
}
