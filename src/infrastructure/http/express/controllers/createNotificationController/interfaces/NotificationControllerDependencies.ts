import { SendNotificationUseCase } from "../../../../../../application/useCases/createSendNotificationUseCase/index.js";

export interface NotificationControllerDependencies {
  sendNotificationUseCase: SendNotificationUseCase;
}
