export interface NotificationProcessService {
  processNotifications: () => Promise<void>;
}
