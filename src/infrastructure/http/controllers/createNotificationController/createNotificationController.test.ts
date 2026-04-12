import { type Request, type Response } from "express";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import {
  type NotificationResult,
  NOTIFY_STATUS,
} from "../../../../application/types/index.js";

import { createNotificationController } from "./createNotificationController.js";
import { type NotificationControllerDependencies } from "./interfaces/index.js";
import {
  parseInitiator,
  validateBatchLimit,
  validateIncomingNotification,
} from "./utils/index.js";

interface BatchSummary {
  total: number;
  accepted: number;
  rejected: number;
}

interface BatchResponse {
  message: string;
  payload: {
    summary: BatchSummary;
    payload: NotificationResult[];
  };
}

interface SingleResponse {
  payload: unknown;
  message?: string;
}

vi.mock("./utils/index.js", () => ({
  validateIncomingNotification: vi.fn(),
  validateBatchLimit: vi.fn(),
  parseInitiator: vi.fn(),
}));

describe("NotificationController", () => {
  let mockRes: Partial<Response>;

  const mockReceiveNotificationUseCase = {
    execute: vi.fn(),
  };

  const mockReceiveNotificationBatchUseCase = {
    execute: vi.fn(),
  };

  const dependencies: NotificationControllerDependencies = {
    receiveNotificationUseCase:
      mockReceiveNotificationUseCase as unknown as NotificationControllerDependencies["receiveNotificationUseCase"],
    receiveNotificationBatchUseCase:
      mockReceiveNotificationBatchUseCase as unknown as NotificationControllerDependencies["receiveNotificationBatchUseCase"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe("send", () => {
    it("should return 400 if single notification validation fails", async () => {
      vi.mocked(validateIncomingNotification).mockReturnValue({
        success: false,
        error: "Invalid field",
      } as unknown as ReturnType<typeof validateIncomingNotification>);

      const controller = createNotificationController(dependencies);
      await controller.send(
        { body: {} } as unknown as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
      const jsonMock = mockRes.json as Mock<
        (body: { message: string }) => Response
      >;
      expect(jsonMock.mock.calls[0]?.[0].message).toBe(
        "Уведомление не прошло валидацию",
      );
    });

    it("should return 200 and notify payload if validation succeeds", async () => {
      const mockData = { message: "test" };
      const mockResult = { id: "123" };

      vi.mocked(validateIncomingNotification).mockReturnValue({
        success: true,
        data: mockData,
      } as unknown as ReturnType<typeof validateIncomingNotification>);

      vi.mocked(parseInitiator).mockReturnValue({
        id: "user1",
      } as unknown as ReturnType<typeof parseInitiator>);

      mockReceiveNotificationUseCase.execute.mockResolvedValue(mockResult);

      const controller = createNotificationController(dependencies);
      await controller.send(
        { body: mockData, user: {} } as unknown as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      const jsonMock = mockRes.json as Mock<(body: SingleResponse) => Response>;
      expect(jsonMock.mock.calls[0]?.[0].payload).toEqual(mockResult);
    });
  });

  describe("sendBatch", () => {
    it("should return 400 if batch limit validation fails", async () => {
      vi.mocked(validateBatchLimit).mockReturnValue({
        success: false,
        error: "Too large",
      } as unknown as ReturnType<typeof validateBatchLimit>);

      const controller = createNotificationController(dependencies);
      await controller.sendBatch(
        { body: [] } as unknown as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it("should return 202 and success message when all batch items are valid", async () => {
      const batchData = [{ msg: "1" }];
      vi.mocked(validateBatchLimit).mockReturnValue({
        success: true,
        data: batchData,
      } as unknown as ReturnType<typeof validateBatchLimit>);

      vi.mocked(validateIncomingNotification).mockReturnValue({
        success: true,
        data: { msg: "1" },
      } as unknown as ReturnType<typeof validateIncomingNotification>);

      mockReceiveNotificationBatchUseCase.execute.mockResolvedValue([
        { status: NOTIFY_STATUS.SUCCESS, payload: { id: "1" } },
      ]);

      const controller = createNotificationController(dependencies);
      await controller.sendBatch(
        { body: batchData } as unknown as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(202);
      const jsonMock = mockRes.json as Mock<(body: BatchResponse) => Response>;
      expect(jsonMock.mock.calls[0]?.[0].message).toBe(
        "Все уведомления приняты в обработку",
      );
    });

    it("should return 207 if some items in batch failed validation", async () => {
      const batchData = ["item1", "item2"];
      vi.mocked(validateBatchLimit).mockReturnValue({
        success: true,
        data: batchData,
      } as unknown as ReturnType<typeof validateBatchLimit>);

      vi.mocked(validateIncomingNotification)
        .mockReturnValueOnce({
          success: true,
          data: { id: "v" },
        } as unknown as ReturnType<typeof validateIncomingNotification>)
        .mockReturnValueOnce({
          success: false,
          error: "validation error",
        } as unknown as ReturnType<typeof validateIncomingNotification>);

      mockReceiveNotificationBatchUseCase.execute.mockResolvedValue([
        { status: NOTIFY_STATUS.SUCCESS, payload: { id: "v" } },
      ]);

      const controller = createNotificationController(dependencies);
      await controller.sendBatch(
        { body: batchData } as unknown as Request,
        mockRes as Response,
      );

      expect(mockRes.status).toHaveBeenCalledWith(207);

      const jsonMock = mockRes.json as Mock<(body: BatchResponse) => Response>;
      const responseBody = jsonMock.mock.calls[0]?.[0];

      if (!responseBody) {
        throw new Error("Response body was not captured");
      }

      expect(responseBody.payload.summary.rejected).toBe(1);
      expect(responseBody.payload.summary.accepted).toBe(1);
      expect(responseBody.payload.payload[1]?.status).toBe(
        NOTIFY_STATUS.CLIENT_ERROR,
      );
    });
  });
});
