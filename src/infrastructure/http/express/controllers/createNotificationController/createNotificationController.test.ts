import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { createNotificationController } from "./createNotificationController.js";
import { SendResult } from "../../../../../application/services/createNotificationDeliveryService/index.js";
import { Notification } from "../../../../../domain/interfaces/Notification.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";
import { NotificationBatchResult } from "../../../../../application/useCases/createSendNotificationUseCase/index.js";

const emailRecipient: Recipient = { type: "email", value: "user1@example.com" };

const notification: Notification = {
  recipients: [emailRecipient],
  message: "Привет!",
};

const mockSendNotificationUseCase = {
  send: vi.fn<
    (input: unknown) => Promise<{
      totalCount: number;
      successCount: number;
      errorCount: number;
      results: SendResult[];
    }>
  >(),
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

  it("should return status 201 when all notifications are sent successfully", async () => {
    req.validatedBody = notification;

    const result: NotificationBatchResult = {
      totalCount: 1,
      successCount: 1,
      errorCount: 0,
      results: [{ success: true, notification }],
    };

    mockSendNotificationUseCase.send.mockResolvedValueOnce(result);

    res.status = vi.fn().mockReturnThis();
    res.send = vi.fn();

    await controller.send(req, res);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith(notification);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalled();
  });

  it("should return status 207 when some notifications fail", async () => {
    const notif1 = { ...notification, message: "Успех" };
    const notif2 = { ...notification, message: "Ошибка" };

    req.validatedBody = [notif1, notif2];

    const error = new Error("Delivery failed");
    const result: NotificationBatchResult = {
      totalCount: 2,
      successCount: 1,
      errorCount: 1,
      results: [
        { success: true, notification: notif1 },
        { success: false, notification: notif2, error },
      ],
    };

    mockSendNotificationUseCase.send.mockResolvedValueOnce(result);

    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();

    await controller.send(req, res);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      notif1,
      notif2,
    ]);
    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith({
      message: "Уведомления частично отправлены",
      totalCount: 2,
      successCount: 1,
      errorCount: 1,
      details: [
        { status: "success", recipients: notif1.recipients },
        { status: "error", recipients: notif2.recipients },
      ],
    });
  });

  it("should return status 207 with 'none sent' message when all notifications fail", async () => {
    const notif1 = { ...notification, message: "Ошибка 1" };
    const notif2 = { ...notification, message: "Ошибка 2" };

    req.validatedBody = [notif1, notif2];

    const result = {
      totalCount: 2,
      successCount: 0,
      errorCount: 2,
      results: [
        { success: false, notification: notif1, error: new Error("Fail 1") },
        { success: false, notification: notif2, error: new Error("Fail 2") },
      ],
    };

    mockSendNotificationUseCase.send.mockResolvedValueOnce(result);

    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();

    await controller.send(req, res);

    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith({
      message: "Не удалось отправить ни одного уведомления",
      totalCount: 2,
      successCount: 0,
      errorCount: 2,
      details: [
        { status: "error", recipients: notif1.recipients },
        { status: "error", recipients: notif2.recipients },
      ],
    });
  });

  it("should return status 500 when use case throws an unexpected error", async () => {
    req.validatedBody = notification;

    res.status = vi.fn().mockReturnThis();
    res.json = vi.fn();

    mockSendNotificationUseCase.send.mockRejectedValueOnce(
      new Error("Internal server error"),
    );

    await controller.send(req, res);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith(notification);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 500 Internal Server Error",
      message: "Не удалось отправить уведомление",
    });
  });

  it("should handle single notification object correctly", async () => {
    req.validatedBody = notification;

    const result: NotificationBatchResult = {
      totalCount: 1,
      successCount: 1,
      errorCount: 0,
      results: [{ success: true, notification }],
    };

    mockSendNotificationUseCase.send.mockResolvedValueOnce(result);

    res.status = vi.fn().mockReturnThis();
    res.send = vi.fn();

    await controller.send(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalled();
  });

  it("should handle array of notifications correctly", async () => {
    const notif1 = { ...notification, message: "Msg 1" };
    const notif2 = { ...notification, message: "Msg 2" };
    req.validatedBody = [notif1, notif2];

    const result: NotificationBatchResult = {
      totalCount: 2,
      successCount: 2,
      errorCount: 0,
      results: [
        { success: true, notification: notif1 },
        { success: true, notification: notif2 },
      ],
    };

    mockSendNotificationUseCase.send.mockResolvedValueOnce(result);

    res.status = vi.fn().mockReturnThis();
    res.send = vi.fn();

    await controller.send(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalled();
  });
});
