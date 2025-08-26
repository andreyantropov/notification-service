import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";
import { createNotificationController } from "./createNotificationController.js";
import { SendResult } from "../../../../../application/services/createNotificationDeliveryService/index.js";
import { Notification } from "../../../../../domain/interfaces/Notification.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";

const emailRecipient: Recipient = { type: "email", value: "user1@example.com" };

const validNotification: Notification = {
  recipients: [emailRecipient],
  message: "Привет!",
};

const invalidNotification = {
  recipients: [],
  message: "",
};

const mockSendNotificationUseCase = {
  send: vi.fn<
    (input: Notification | Notification[]) => Promise<SendResult[]>
  >(),
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

  it("should return 201 when all notifications are valid and sent successfully", async () => {
    req.body = validNotification;

    const result: SendResult[] = [
      { success: true, notification: validNotification },
    ];

    mockSendNotificationUseCase.send.mockResolvedValueOnce(result);

    await controller.send(req as Request, res as Response);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      validNotification,
    ]);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalled();
  });

  it("should return 207 when some notifications fail validation", async () => {
    req.body = [validNotification, invalidNotification];

    const deliveryResult: SendResult[] = [
      { success: true, notification: validNotification },
    ];

    mockSendNotificationUseCase.send.mockResolvedValueOnce(deliveryResult);

    await controller.send(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith({
      message: "Уведомления частично отправлены",
      totalCount: 2,
      successCount: 1,
      validationErrorCount: 1,
      deliveryErrorCount: 0,
      details: [
        {
          status: "success",
          notification: validNotification,
        },
        {
          status: "error",
          notification: invalidNotification,
          message:
            "Некорректная структура уведомления. Исправьте данные и повторите запрос.",
          errors: expect.any(Array),
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

  it("should return 207 when some notifications fail during delivery", async () => {
    req.body = [validNotification];

    const error = new Error("Network timeout");
    const result: SendResult[] = [
      { success: false, notification: validNotification, error },
    ];

    mockSendNotificationUseCase.send.mockResolvedValueOnce(result);

    await controller.send(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith({
      message: "Не удалось отправить ни одного уведомления",
      totalCount: 1,
      successCount: 0,
      validationErrorCount: 0,
      deliveryErrorCount: 1,
      details: [
        {
          status: "error",
          notification: validNotification,
          error: error,
        },
      ],
    });
  });

  it("should return 207 with mixed validation and delivery errors", async () => {
    const notif1 = { ...validNotification, message: "Valid" };
    const notif2 = { ...validNotification, message: "Fails in delivery" };
    const notif3 = { recipients: [], message: "" };

    req.body = [notif1, notif2, notif3];

    const deliveryResult: SendResult[] = [
      { success: true, notification: notif1 },
      {
        success: false,
        notification: notif2,
        error: new Error("Failed to send"),
      },
    ];

    mockSendNotificationUseCase.send.mockResolvedValueOnce(deliveryResult);

    await controller.send(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith({
      message: "Уведомления частично отправлены",
      totalCount: 3,
      successCount: 1,
      validationErrorCount: 1,
      deliveryErrorCount: 1,
      details: expect.arrayContaining([
        { status: "success", notification: notif1 },
        expect.objectContaining({
          status: "error",
          notification: notif2,
          error: expect.any(Error),
        }),
        expect.objectContaining({
          status: "error",
          notification: notif3,
          message: expect.stringContaining("Исправьте данные"),
          errors: expect.any(Array),
        }),
      ]),
    });
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

  it("should handle single notification object (not array)", async () => {
    req.body = validNotification;

    const result: SendResult[] = [
      { success: true, notification: validNotification },
    ];

    mockSendNotificationUseCase.send.mockResolvedValueOnce(result);

    await controller.send(req as Request, res as Response);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      validNotification,
    ]);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("should handle array of notifications", async () => {
    const notif1 = { ...validNotification, message: "Msg 1" };
    const notif2 = { ...validNotification, message: "Msg 2" };
    req.body = [notif1, notif2];

    const result: SendResult[] = [
      { success: true, notification: notif1 },
      { success: true, notification: notif2 },
    ];

    mockSendNotificationUseCase.send.mockResolvedValueOnce(result);

    await controller.send(req as Request, res as Response);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      notif1,
      notif2,
    ]);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
