import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { createNotificationController } from "./createNotificationController.js";

const mockSendNotificationUseCase = {
  send: vi.fn(),
};

describe("NotificationController", () => {
  const controller = createNotificationController({
    sendNotificationUseCase: mockSendNotificationUseCase,
  });

  const req = {} as Request & { validatedBody?: unknown };
  const res = {} as Response;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return status 201 when notification is sent successfully", async () => {
    req.validatedBody = {
      recipients: ["user1@example.com"],
      message: "Привет!",
    };

    res.status = vi.fn().mockReturnThis();
    res.send = vi.fn();

    await controller.send(req, res);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith({
      recipients: ["user1@example.com"],
      message: "Привет!",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalled();
  });

  it("should return status 500 when use case throws an error", async () => {
    req.validatedBody = {
      recipients: ["user1@example.com"],
      message: "Ошибка",
    };

    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();

    mockSendNotificationUseCase.send.mockRejectedValueOnce(
      new Error("Internal error"),
    );

    await controller.send(req, res);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith({
      recipients: ["user1@example.com"],
      message: "Ошибка",
    });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 500 Internal Server Error",
      message: "Не удалось отправить уведомление",
    });
  });
});
