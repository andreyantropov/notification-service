import { describe, expect, it, vi } from "vitest";

import { STRATEGY_TYPE, type StrategyType } from "../../types/index.js";
import { sendToAllAvailableStrategy } from "../sendToAllAvailableStrategy/index.js";
import { sendToFirstAvailableStrategy } from "../sendToFirstAvailableStrategy/index.js";

import { resolveStrategy } from "./resolveStrategy.js";

vi.mock("../sendToAllAvailableStrategy/index.js", () => ({
  sendToAllAvailableStrategy: vi.fn(),
}));

vi.mock("../sendToFirstAvailableStrategy/index.js", () => ({
  sendToFirstAvailableStrategy: vi.fn(),
}));

describe("resolveStrategy", () => {
  it("should return sendToFirstAvailableStrategy for SEND_TO_FIRST_AVAILABLE type", () => {
    const strategy = resolveStrategy(STRATEGY_TYPE.SEND_TO_FIRST_AVAILABLE);

    expect(strategy).toBe(sendToFirstAvailableStrategy);
  });

  it("should return sendToAllAvailableStrategy for SEND_TO_ALL_AVAILABLE type", () => {
    const strategy = resolveStrategy(STRATEGY_TYPE.SEND_TO_ALL_AVAILABLE);

    expect(strategy).toBe(sendToAllAvailableStrategy);
  });

  it("should throw an error if strategy type is unknown", () => {
    const unknownType = "unknown_strategy" as StrategyType;

    expect(() => resolveStrategy(unknownType)).toThrowError(
      `Неизвестный тип стратегии: ${unknownType}`,
    );
  });
});
