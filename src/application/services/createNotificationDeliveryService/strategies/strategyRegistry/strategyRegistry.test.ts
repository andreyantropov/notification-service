import { describe, it, expect } from "vitest";

import { DEFAULT_STRATEGY_KEY, strategyRegistry } from "./strategyRegistry.js";
import {
  DELIVERY_STRATEGIES,
  DeliveryStrategies,
} from "../../../../../domain/types/index.js";

describe("strategyRegistry", () => {
  it('should export DEFAULT_STRATEGY_KEY as "send_to_first_available"', () => {
    expect(DEFAULT_STRATEGY_KEY).toBe(
      DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE,
    );
  });

  it("should have a strategy for every DeliveryStrategies variant", () => {
    const expectedKeys: DeliveryStrategies[] =
      Object.values(DELIVERY_STRATEGIES);
    const actualKeys = Object.keys(strategyRegistry);

    expect(actualKeys).toHaveLength(expectedKeys.length);
    expectedKeys.forEach((key) => {
      expect(actualKeys).toContain(key);
    });
  });

  it("should map each key to a valid DeliveryStrategy function", () => {
    Object.entries(strategyRegistry).forEach(([key, strategy]) => {
      expect(key).toBeTypeOf("string");
      expect(strategy).toBeTypeOf("function");
      expect(typeof strategy).toBe("function");
    });
  });

  it("should include send_to_first_available strategy", () => {
    const strategy =
      strategyRegistry[DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE];
    expect(strategy).toBeDefined();
    expect(typeof strategy).toBe("function");
  });

  it("should include send_to_all_available strategy", () => {
    const strategy =
      strategyRegistry[DELIVERY_STRATEGIES.SEND_TO_ALL_AVAILABLE];
    expect(strategy).toBeDefined();
    expect(typeof strategy).toBe("function");
  });

  it("should not allow extra or missing strategies", () => {
    const registryKeys = new Set(Object.keys(strategyRegistry));
    const expectedKeys = new Set(Object.values(DELIVERY_STRATEGIES));

    expect(registryKeys).toEqual(expectedKeys);
  });
});
