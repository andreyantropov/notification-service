import { DeliveryStrategy } from "../../../../../../domain/enums/DeliveryStrategy.js";

export const DEFAULT_STRATEGY = DeliveryStrategy.sendToFirstAvailable;
export const DEFAULT_SUBJECT = "unknown";
export const DEFAULT_IS_IMMEDIATE = false;
export const NOTIFICATIONS_PROCESSED_TOTAL = "notifications_processed_total";
export const NOTIFICATIONS_PROCESSED_BY_STATUS_TOTAL = "notifications_processed_by_status_total";
export const NOTIFICATIONS_PROCESSED_BY_SUBJECT_TOTAL = "notifications_processed_by_subject_total";
export const NOTIFICATIONS_PROCESSED_BY_STRATEGY_TOTAL = "notifications_processed_by_strategy_total";
export const NOTIFICATIONS_PROCESSED_BY_PRIORITY_TOTAL = "notifications_processed_by_priority_total";
