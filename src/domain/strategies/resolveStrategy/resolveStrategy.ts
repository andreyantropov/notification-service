import {
  type Strategy,
  STRATEGY_TYPE,
  type StrategyType,
} from "../../types/index.js";
import { sendToAllAvailableStrategy } from "../sendToAllAvailableStrategy/index.js";
import { sendToAnyAvailableStrategy } from "../sendToAnyAvailableStrategy/index.js";
import { sendToFirstAvailableStrategy } from "../sendToFirstAvailableStrategy/index.js";

const STRATEGY_MAP: Record<StrategyType, Strategy> = {
  [STRATEGY_TYPE.SEND_TO_FIRST_AVAILABLE]: sendToFirstAvailableStrategy,
  [STRATEGY_TYPE.SEND_TO_ANY_AVAILABLE]: sendToAnyAvailableStrategy,
  [STRATEGY_TYPE.SEND_TO_ALL_AVAILABLE]: sendToAllAvailableStrategy,
};

export const resolveStrategy = (type: StrategyType): Strategy => {
  const strategy = STRATEGY_MAP[type];
  if (!strategy) {
    throw new Error(`Неизвестный тип стратегии: ${type}`);
  }
  return strategy;
};
