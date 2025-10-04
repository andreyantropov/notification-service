export interface SendNotificationProcess {
  start: () => void;
  shutdown: () => Promise<void>;
}
