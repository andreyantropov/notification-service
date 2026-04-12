import { type Request, type Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createHealthController } from "./createHealthController.js";
import { type HealthControllerDependencies } from "./interfaces/index.js";

describe("HealthController", () => {
  let mockRes: Partial<Response>;

  const mockCheckLivenessUseCase = {
    execute: vi.fn(),
  };
  const mockCheckReadinessUseCase = {
    execute: vi.fn(),
  };

  const dependencies: HealthControllerDependencies = {
    checkLivenessUseCase: mockCheckLivenessUseCase,
    checkReadinessUseCase: mockCheckReadinessUseCase,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("live", () => {
    it("should return 200 when liveness check succeeds", async () => {
      mockCheckLivenessUseCase.execute.mockResolvedValue(undefined);

      const controller = createHealthController(dependencies);
      await controller.live({} as Request, mockRes as Response);

      expect(mockCheckLivenessUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("should return 503 when liveness check fails", async () => {
      mockCheckLivenessUseCase.execute.mockRejectedValue(
        new Error("Process hanging"),
      );

      const controller = createHealthController(dependencies);
      await controller.live({} as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Сервис временно недоступен",
      });
    });
  });

  describe("ready", () => {
    it("should return 200 when readiness check succeeds", async () => {
      mockCheckReadinessUseCase.execute.mockResolvedValue(undefined);

      const controller = createHealthController(dependencies);
      await controller.ready({} as Request, mockRes as Response);

      expect(mockCheckReadinessUseCase.execute).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("should return 503 when readiness check fails", async () => {
      mockCheckReadinessUseCase.execute.mockRejectedValue(
        new Error("DB Connection failed"),
      );

      const controller = createHealthController(dependencies);
      await controller.ready({} as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Сервис временно недоступен",
      });
    });
  });
});
