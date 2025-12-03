export interface CheckNotificationServiceHealthUseCase {
  readonly checkHealth: () => Promise<void>;
}
