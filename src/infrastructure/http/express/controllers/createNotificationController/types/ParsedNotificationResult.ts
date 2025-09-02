import { Notification } from "../../../../../../domain/types/Notification.js";

export type ParsedNotificationResult = {
  valid: Notification[];
  invalid: { item: unknown; error: unknown }[];
};
