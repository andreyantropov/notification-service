import { Buffer } from "../../../ports/Buffer.js";
import { LoggerAdapter } from "../../../ports/LoggerAdapter.js";
import { TracingContextManager } from "../../../ports/TracingContextManager.js";
import { NotificationDeliveryService } from "../../../services/createNotificationDeliveryService/index.js";
import { BufferedNotification } from "../../../types/BufferedNotification.js";

export interface SendNotificationUseCaseDependencies {
  buffer: Buffer<BufferedNotification>;
  notificationDeliveryService: NotificationDeliveryService;
  tracingContextManager: TracingContextManager;
  loggerAdapter?: LoggerAdapter;
}
