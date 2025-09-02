import { vi, describe, it, expect, beforeEach } from "vitest";
import { createHealthcheckController } from "./createHealthcheckController.js";
import { Request, Response } from "express";
import { SendNotificationUseCase } from "../../../../../application/useCases/createSendNotificationUseCase/index.js";

describe("HealthcheckController", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let sendMock: ReturnType<typeof vi.fn>;
  let jsonMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {};
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    sendMock = mockRes.send as ReturnType<typeof vi.fn>;
    jsonMock = mockRes.json as ReturnType<typeof vi.fn>;
  });

  describe("live", () => {
    it("should return 200 OK", async () => {
      const mockUseCase: SendNotificationUseCase = {
        send: vi.fn(),
      };

      const controller = createHealthcheckController({
        sendNotificationUseCase: mockUseCase,
      });

      await controller.live(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe("ready", () => {
    it("should return 200 OK if checkHealth is successful or not present", async () => {
      const mockCheckHealth = vi.fn().mockResolvedValue(undefined);
      const mockUseCase: SendNotificationUseCase = {
        send: vi.fn(),
        checkHealth: mockCheckHealth,
      };

      const controller = createHealthcheckController({
        sendNotificationUseCase: mockUseCase,
      });

      await controller.ready(mockReq as Request, mockRes as Response);

      expect(mockCheckHealth).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 200 OK if checkHealth is not defined", async () => {
      const mockUseCase: SendNotificationUseCase = {
        send: vi.fn(),
      };

      const controller = createHealthcheckController({
        sendNotificationUseCase: mockUseCase,
      });

      await controller.ready(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(sendMock).toHaveBeenCalled();
    });

    it("should return 503 Service Unavailable if checkHealth fails", async () => {
      const testError = new Error("Service unavailable");
      const mockUseCase: SendNotificationUseCase = {
        send: vi.fn(),
        checkHealth: vi.fn().mockRejectedValue(testError),
      };

      const controller = createHealthcheckController({
        sendNotificationUseCase: mockUseCase,
      });

      await controller.ready(mockReq as Request, mockRes as Response);

      expect(mockUseCase.checkHealth).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "HTTP 503 Service Unavailable",
        message: "Сервис недоступен",
      });
    });
  });
});
