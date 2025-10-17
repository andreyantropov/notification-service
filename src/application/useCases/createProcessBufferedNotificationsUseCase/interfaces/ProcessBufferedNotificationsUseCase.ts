export interface ProcessBufferedNotificationsUseCase {
  process: () => Promise<void>;
}
