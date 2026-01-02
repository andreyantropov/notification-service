import type { HandleIncomingNotificationsUseCase } from "../../../../../../application/useCases/createHandleIncomingNotificationsUseCase/index.js";

export interface NotificationControllerDependencies {
  readonly handleIncomingNotificationsUseCase: HandleIncomingNotificationsUseCase;
}
