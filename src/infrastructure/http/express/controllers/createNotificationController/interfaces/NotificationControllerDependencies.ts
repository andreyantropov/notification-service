import { HandleIncomingNotificationsUseCase } from "../../../../../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";

export interface NotificationControllerDependencies {
  handleIncomingNotificationsUseCase: HandleIncomingNotificationsUseCase;
}
