import { describe, expect, it, vi } from "vitest";

import { createHealthReporter } from "./createHealthReporter.js";

interface HealthCheckable {
  checkHealth?: () => Promise<void>;
}

describe("createHealthReporter", () => {
  describe("checkHealth", () => {
    it("should resolve when all objects with checkHealth succeed", async () => {
      const mockObject1: HealthCheckable = {
        checkHealth: vi.fn().mockResolvedValue(undefined),
      };
      const mockObject2: HealthCheckable = {
        checkHealth: vi.fn().mockResolvedValue(undefined),
      };
      const mockObject3: HealthCheckable = {};

      const reporter = createHealthReporter({
        objects: [mockObject1, mockObject2, mockObject3],
      });

      await expect(reporter.checkHealth()).resolves.toBeUndefined();
      expect(mockObject1.checkHealth).toHaveBeenCalledOnce();
      expect(mockObject2.checkHealth).toHaveBeenCalledOnce();
    });

    it("should reject if at least one checkHealth fails", async () => {
      const error = new Error("Connection failed");
      const mockObjectOk: HealthCheckable = {
        checkHealth: vi.fn().mockResolvedValue(undefined),
      };
      const mockObjectFail: HealthCheckable = {
        checkHealth: vi.fn().mockRejectedValue(error),
      };

      const reporter = createHealthReporter({
        objects: [mockObjectOk, mockObjectFail],
      });

      await expect(reporter.checkHealth()).rejects.toThrow("Connection failed");
    });

    it("should resolve if the objects list is empty", async () => {
      const reporter = createHealthReporter({ objects: [] });
      await expect(reporter.checkHealth()).resolves.toBeUndefined();
    });

    it("should call all checkHealth methods in parallel", async () => {
      let activeCalls = 0;
      let maxParallel = 0;

      const delayedCheck = async () => {
        activeCalls++;
        maxParallel = Math.max(maxParallel, activeCalls);
        await new Promise((resolve) => setTimeout(resolve, 10));
        activeCalls--;
      };

      const reporter = createHealthReporter({
        objects: [
          { checkHealth: delayedCheck },
          { checkHealth: delayedCheck },
          { checkHealth: delayedCheck },
        ],
      });

      await reporter.checkHealth();

      expect(maxParallel).toBe(3);
    });
  });
});
