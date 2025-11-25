import { Request, Response } from "express";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { createHealthcheckController } from "./createHealthcheckController.js";
import { CheckNotificationServiceHealthUseCase } from "../../../../../application/useCases/createCheckNotificationServiceHealthUseCase/index.js";

describe("HealthcheckController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
  });

  describe("live", () => {
    it("should return 200 OK", async () => {
      const mockUseCase = {} as CheckNotificationServiceHealthUseCase;

      const controller = createHealthcheckController({
        checkNotificationServiceHealthUseCase: mockUseCase,
      });

      await controller.live(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });
  });

  describe("ready", () => {
    it("should return 200 OK if checkHealth succeeds", async () => {
      const mockCheckHealth = vi.fn().mockResolvedValue(undefined);
      const mockUseCase: CheckNotificationServiceHealthUseCase = {
        checkHealth: mockCheckHealth,
      };

      const controller = createHealthcheckController({
        checkNotificationServiceHealthUseCase: mockUseCase,
      });

      await controller.ready(mockReq as Request, mockRes as Response);

      expect(mockCheckHealth).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("should return 200 OK if checkHealth is not implemented (implicit success)", async () => {
      const mockUseCase: CheckNotificationServiceHealthUseCase = {
        checkHealth: vi.fn().mockResolvedValue(undefined),
      };

      const controller = createHealthcheckController({
        checkNotificationServiceHealthUseCase: mockUseCase,
      });

      await controller.ready(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.send).toHaveBeenCalled();
    });

    it("should return 503 Service Unavailable if checkHealth fails", async () => {
      const mockUseCase: CheckNotificationServiceHealthUseCase = {
        checkHealth: vi.fn().mockRejectedValue(new Error("Delivery failed")),
      };

      const controller = createHealthcheckController({
        checkNotificationServiceHealthUseCase: mockUseCase,
      });

      await controller.ready(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "HTTP 503 Service Unavailable",
        message: "Сервис недоступен",
      });
    });

    it("should return 503 Service Unavailable if checkHealth times out", async () => {
      vi.useFakeTimers();

      const mockUseCase: CheckNotificationServiceHealthUseCase = {
        checkHealth: vi.fn().mockReturnValue(new Promise(() => {})),
      };

      const controller = createHealthcheckController({
        checkNotificationServiceHealthUseCase: mockUseCase,
      });

      const readyPromise = controller.ready(
        mockReq as Request,
        mockRes as Response,
      );

      vi.advanceTimersByTime(5001);

      await readyPromise;

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "HTTP 503 Service Unavailable",
        message: "Сервис недоступен",
      });

      vi.useRealTimers();
    });
  });
});
