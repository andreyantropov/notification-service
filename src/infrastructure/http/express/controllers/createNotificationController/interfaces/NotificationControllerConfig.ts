import { SendNotificationUseCase } from "../../../../../../application/useCases/createSendNotificationUseCase/index.js";

export interface NotificationControllerConfig {
  sendNotificationUseCase: SendNotificationUseCase;
}
