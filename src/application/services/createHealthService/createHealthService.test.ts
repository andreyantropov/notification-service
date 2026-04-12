import { describe, expect, it, vi } from "vitest";

import { createHealthService } from "./createHealthService.js";

describe("createHealthService", () => {
  const createMocks = () => ({
    healthReporter: {
      checkHealth: vi.fn(),
    },
  });

  describe("checkLiveness", () => {
    it("should resolve immediately", async () => {
      const { healthReporter } = createMocks();
      const service = createHealthService({ healthReporter });

      await expect(service.checkLiveness()).resolves.toBeUndefined();
      expect(healthReporter.checkHealth).not.toHaveBeenCalled();
    });
  });

  describe("checkReadiness", () => {
    it("should call healthReporter.checkHealth", async () => {
      const { healthReporter } = createMocks();
      healthReporter.checkHealth.mockResolvedValue(undefined);
      const service = createHealthService({ healthReporter });

      await expect(service.checkReadiness()).resolves.toBeUndefined();
      expect(healthReporter.checkHealth).toHaveBeenCalledOnce();
    });

    it("should throw error if healthReporter fails", async () => {
      const { healthReporter } = createMocks();
      const error = new Error("DB Connection Error");
      healthReporter.checkHealth.mockRejectedValue(error);
      const service = createHealthService({ healthReporter });

      await expect(service.checkReadiness()).rejects.toThrow(
        "DB Connection Error",
      );
    });
  });
});
