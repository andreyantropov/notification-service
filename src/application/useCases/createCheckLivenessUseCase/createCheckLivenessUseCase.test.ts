import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { type HealthService } from "../../services/index.js";

import { createCheckLivenessUseCase } from "./createCheckLivenessUseCase.js";
import { type CheckLivenessUseCaseDependencies } from "./interfaces/index.js";

describe("CheckLivenessUseCase", () => {
  const mockHealthService: HealthService = {
    checkLiveness: vi.fn(),
    checkReadiness: vi.fn(),
  };

  const dependencies: CheckLivenessUseCaseDependencies = {
    healthService: mockHealthService,
  };

  const useCase = createCheckLivenessUseCase(dependencies);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delegate the liveness check to the health service", async () => {
    (mockHealthService.checkLiveness as Mock).mockResolvedValue(undefined);

    await useCase.execute();

    expect(mockHealthService.checkLiveness).toHaveBeenCalledTimes(1);
    expect(mockHealthService.checkReadiness).not.toHaveBeenCalled();
  });

  it("should propagate errors from the health service during a liveness check", async () => {
    const livenessError = new Error("Process is not responding");
    (mockHealthService.checkLiveness as Mock).mockRejectedValue(livenessError);

    await expect(useCase.execute()).rejects.toThrow(livenessError);
  });
});
