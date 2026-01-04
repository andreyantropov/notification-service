import { DeliveryStrategy } from "@notification-platform/shared";

export const DEFAULT_STRATEGY = DeliveryStrategy.sendToFirstAvailable;
export const DEFAULT_SUBJECT = "unknown";
export const DEFAULT_IS_IMMEDIATE = false;
export const NOTIFICATIONS_PROCESSED_TOTAL = "notifications_processed_total";
export const NOTIFICATIONS_PROCESSED_BY_STATUS = "notifications_processed_by_status";
export const NOTIFICATIONS_PROCESSED_BY_SUBJECT = "notifications_processed_by_subject";
export const NOTIFICATIONS_PROCESSED_BY_STRATEGY = "notifications_processed_by_strategy";
export const NOTIFICATIONS_PROCESSED_BY_PRIORITY = "notifications_processed_by_priority";
