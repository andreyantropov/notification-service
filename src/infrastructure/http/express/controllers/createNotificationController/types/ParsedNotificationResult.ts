import { RawNotification } from "../../../../../../application/types/RawNotification.js";

export type ParsedNotificationResult = {
  valid: RawNotification[];
  invalid: { item: unknown; error: unknown }[];
};
