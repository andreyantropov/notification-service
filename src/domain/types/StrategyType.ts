export const STRATEGY_TYPE = {
  SEND_TO_FIRST_AVAILABLE: "send_to_first_available",
  SEND_TO_ANY_AVAILABLE: "send_to_any_available",
  SEND_TO_ALL_AVAILABLE: "send_to_all_available",
} as const;

export type StrategyType = (typeof STRATEGY_TYPE)[keyof typeof STRATEGY_TYPE];
