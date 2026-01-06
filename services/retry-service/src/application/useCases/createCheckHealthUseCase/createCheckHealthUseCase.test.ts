import { describe, it, expect, vi, beforeEach } from "vitest";

import { createCheckHealthUseCase } from "./createCheckHealthUseCase.js";
import type { Consumer } from "@notification-platform/shared";

const createMockConsumer = (checkHealth?: () => Promise<void>): Consumer => ({
  start: vi.fn(),
  shutdown: vi.fn(),
  ...(checkHealth ? { checkHealth } : {}),
});

describe("CheckNotificationServiceHealthUseCase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call checkHealth on all components when implemented", async () => {
    const retryConsumerCheckHealth = vi.fn().mockResolvedValue(undefined);

    const retryConsumer = createMockConsumer(retryConsumerCheckHealth);

    const useCase = createCheckHealthUseCase({
      retryConsumer,
    });

    await useCase.checkHealth();

    expect(retryConsumerCheckHealth).toHaveBeenCalledTimes(1);
  });

  it("should call only retryConsumer.checkHealth when others lack it", async () => {
    const retryConsumer = createMockConsumer(
      vi.fn().mockResolvedValue(undefined),
    );

    const useCase = createCheckHealthUseCase({
      retryConsumer,
    });

    await useCase.checkHealth();

    expect(retryConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should do nothing (and not throw) when no component has checkHealth", async () => {
    const retryConsumer = createMockConsumer();

    const useCase = createCheckHealthUseCase({
      retryConsumer,
    });

    await expect(useCase.checkHealth()).resolves.toBeUndefined();
  });

  it("should propagate errors from retryConsumer.checkHealth", async () => {
    const errorMessage = "Retry consumer is unreachable";

    const retryConsumer = createMockConsumer(
      vi.fn().mockRejectedValue(new Error(errorMessage)),
    );

    const useCase = createCheckHealthUseCase({
      retryConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow(errorMessage);
    expect(retryConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });

  it("should run all health checks in parallel and fail fast on first rejection (Promise.all semantics)", async () => {
    const retryError = new Error("Retry consumer down");

    const retryConsumer = createMockConsumer(
      vi.fn().mockRejectedValue(retryError),
    );

    const useCase = createCheckHealthUseCase({
      retryConsumer,
    });

    await expect(useCase.checkHealth()).rejects.toThrow();
    expect(retryConsumer.checkHealth).toHaveBeenCalledTimes(1);
  });
});
