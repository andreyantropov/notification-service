export interface SendNotificationProcess {
  start: () => void;
  stop: () => Promise<void>;
}
