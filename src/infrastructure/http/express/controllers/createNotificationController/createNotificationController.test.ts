import { Request, Response } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createNotificationController } from "./createNotificationController.js";
import { Notification } from "../../../../../domain/types/Notification.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";

const emailRecipient: Recipient = { type: "email", value: "user1@example.com" };

const validNotification: Notification = {
  recipients: [emailRecipient],
  message: "Привет!",
  isUrgent: true,
};

const invalidNotification = {
  recipients: [],
  message: "",
};

const mockSendNotificationUseCase = {
  send: vi.fn<(input: Notification | Notification[]) => Promise<void>>(),
};

describe("NotificationController", () => {
  const controller = createNotificationController({
    sendNotificationUseCase: mockSendNotificationUseCase,
  });

  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();

    req = { body: null };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      send: vi.fn(),
    };
  });

  it("should return 202 when all notifications are valid", async () => {
    req.body = validNotification;

    await controller.send(req as Request, res as Response);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      validNotification,
    ]);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.send).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 207 when some notifications fail validation", async () => {
    req.body = [validNotification, invalidNotification];

    await controller.send(req as Request, res as Response);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      validNotification,
    ]);
    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith({
      message: "Уведомления приняты частично: 1 принято, 1 отклонено",
      totalCount: 2,
      validCount: 1,
      invalidCount: 1,
      details: [
        {
          success: true,
          notification: validNotification,
        },
        {
          success: false,
          notification: invalidNotification,
          error: expect.any(Array),
        },
      ],
    });
  });

  it("should return 400 when no notifications are valid", async () => {
    req.body = [invalidNotification, { recipients: ["bad"], message: "" }];

    await controller.send(req as Request, res as Response);

    expect(mockSendNotificationUseCase.send).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 400 Bad Request",
      message: "Ни одно уведомление не прошло валидацию",
      details: expect.arrayContaining([
        expect.objectContaining({
          item: invalidNotification,
          error: expect.any(Array),
        }),
      ]),
    });
  });

  it("should return 207 with multiple invalid notifications", async () => {
    const notif1 = { ...validNotification, message: "Valid" };
    const notif2 = { recipients: [], message: "" };
    const notif3 = {
      recipients: [{ type: "email", value: 123 }],
      message: "Bad value",
    };

    req.body = [notif1, notif2, notif3];

    await controller.send(req as Request, res as Response);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([notif1]);
    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith({
      message: "Уведомления приняты частично: 1 принято, 2 отклонено",
      totalCount: 3,
      validCount: 1,
      invalidCount: 2,
      details: expect.arrayContaining([
        { success: true, notification: notif1 },
        expect.objectContaining({ success: false, notification: notif2 }),
        expect.objectContaining({ success: false, notification: notif3 }),
      ]),
    });
  });

  it("should handle single notification object", async () => {
    req.body = validNotification;

    await controller.send(req as Request, res as Response);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      validNotification,
    ]);
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("should handle array of notifications", async () => {
    const notif1 = { ...validNotification, message: "Msg 1" };
    const notif2 = { ...validNotification, message: "Msg 2" };
    req.body = [notif1, notif2];

    await controller.send(req as Request, res as Response);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      notif1,
      notif2,
    ]);
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("should return 500 when use case throws an unexpected error", async () => {
    req.body = validNotification;

    mockSendNotificationUseCase.send.mockRejectedValueOnce(
      new Error("Unexpected error"),
    );

    await controller.send(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "HTTP 500 Internal Server Error",
      message: "Не удалось отправить уведомление",
    });
  });

  it("should return 202 when all notifications are valid (array)", async () => {
    req.body = [validNotification];

    await controller.send(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.send).toHaveBeenCalled();
  });
});
