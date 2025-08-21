import { SendResult } from "../../../services/createNotificationDeliveryService/index.js";

export interface NotificationBatchResult {
  totalCount: number;
  successCount: number;
  errorCount: number;
  results: SendResult[];
}
