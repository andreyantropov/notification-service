import { SendNotificationUseCase } from "../../../../application/useCases/sendNotificationUseCase/index.js";

export interface NotificationControllerConfig {
  sendNotificationUseCase: SendNotificationUseCase;
}
