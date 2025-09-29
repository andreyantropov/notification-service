export interface SendNotificationProcessConfig {
  interval?: number;
  onError?: (error: Error) => void;
}
