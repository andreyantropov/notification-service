import {
  DELIVERY_STRATEGIES,
  DeliveryStrategies,
} from "../../../../../domain/types/DeliveryStrategies.js";
import { DeliveryStrategy } from "../../types/DeliveryStrategy.js";
import { sendToAllAvailableStrategy } from "../sendToAllAvailableStrategy/sendToAllAvailableStrategy.js";
import { sendToFirstAvailableStrategy } from "../sendToFirstAvailableStrategy/sendToFirstAvailableStrategy.js";

export const DEFAULT_STRATEGY_KEY = DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE;

export const strategyRegistry: {
  [K in DeliveryStrategies]: DeliveryStrategy;
} = {
  send_to_first_available: sendToFirstAvailableStrategy,
  send_to_all_available: sendToAllAvailableStrategy,
};
