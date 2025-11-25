export const DELIVERY_STRATEGIES = {
  SEND_TO_FIRST_AVAILABLE: "send_to_first_available",
  SEND_TO_ALL_AVAILABLE: "send_to_all_available",
} as const;

export type DeliveryStrategies =
  (typeof DELIVERY_STRATEGIES)[keyof typeof DELIVERY_STRATEGIES];
