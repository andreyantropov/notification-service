import {
  type ReceiveNotificationBatchUseCase,
  type ReceiveNotificationUseCase,
} from "../../../../../application/useCases/index.js";

export interface NotificationControllerDependencies {
  readonly receiveNotificationUseCase: ReceiveNotificationUseCase;
  readonly receiveNotificationBatchUseCase: ReceiveNotificationBatchUseCase;
}
