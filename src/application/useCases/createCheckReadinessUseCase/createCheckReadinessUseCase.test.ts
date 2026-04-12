import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import { type HealthService } from "../../services/index.js";

import { createCheckReadinessUseCase } from "./createCheckReadinessUseCase.js";
import { type CheckReadinessUseCaseDependencies } from "./interfaces/index.js";

describe("CheckHealthUseCase", () => {
  const mockHealthService: HealthService = {
    checkLiveness: vi.fn(),
    checkReadiness: vi.fn(),
  };

  const dependencies: CheckReadinessUseCaseDependencies = {
    healthService: mockHealthService,
  };

  const useCase = createCheckReadinessUseCase(dependencies);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should delegate the readiness check to the health service", async () => {
    (mockHealthService.checkReadiness as Mock).mockResolvedValue(undefined);

    await useCase.execute();

    expect(mockHealthService.checkReadiness).toHaveBeenCalledTimes(1);
    expect(mockHealthService.checkLiveness).not.toHaveBeenCalled();
  });

  it("should propagate errors from the health service during a readiness check", async () => {
    const readinessError = new Error("Dependency check failed");
    (mockHealthService.checkReadiness as Mock).mockRejectedValue(
      readinessError,
    );

    await expect(useCase.execute()).rejects.toThrow(readinessError);
  });
});
