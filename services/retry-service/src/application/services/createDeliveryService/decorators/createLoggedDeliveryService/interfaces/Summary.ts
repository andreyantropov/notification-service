export interface Summary {
  readonly notificationsCount: number;
  readonly failedIds: readonly string[];
  readonly failedCount: number;
  readonly warningIds: readonly string[];
  readonly warningCount: number;
  readonly successfulIds: readonly string[];
  readonly successfulCount: number;
}
