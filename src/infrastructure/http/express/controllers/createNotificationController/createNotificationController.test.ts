import { Request, Response, NextFunction } from "express";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createNotificationController } from "./createNotificationController.js";
import { RawNotification } from "../../../../../application/types/RawNotification.js";
import { Notification } from "../../../../../domain/types/Notification.js";
import { Recipient } from "../../../../../domain/types/Recipient.js";

const emailRecipient: Recipient = { type: "email", value: "user1@example.com" };

const validRawNotification: RawNotification = {
  recipients: [emailRecipient],
  message: "Привет!",
  isUrgent: true,
};

const invalidNotification = {
  recipients: [],
  message: "",
};

const mockSendNotificationUseCase = {
  send: vi.fn<
    (input: RawNotification | RawNotification[]) => Promise<Notification[]>
  >(),
};

const mockAuthPayload = {
  sub: "user-123",
  preferred_username: "john.doe",
  name: "John Doe",
};

interface AuthenticatedRequest extends Request {
  auth?: {
    payload: unknown;
  };
}

describe("NotificationController", () => {
  let controller: ReturnType<typeof createNotificationController>;
  let req: AuthenticatedRequest;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSendNotificationUseCase.send.mockImplementation((input) => {
      const rawList = Array.isArray(input) ? input : [input];
      const notifications: Notification[] = rawList.map((raw, i) => ({
        id: `generated-id-${i}`,
        ...raw,
      }));
      return Promise.resolve(notifications);
    });

    controller = createNotificationController({
      sendNotificationUseCase: mockSendNotificationUseCase,
    });

    req = {
      body: null,
      auth: {
        payload: mockAuthPayload,
      },
    } as AuthenticatedRequest;
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it("should return 202 when all notifications are valid", async () => {
    req.body = validRawNotification;

    await controller.send(req as Request, res as Response, next);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      {
        ...validRawNotification,
        subject: {
          id: "user-123",
          name: "john.doe",
        },
      },
    ]);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Все уведомления приняты в обработку",
        validCount: 1,
        invalidCount: 0,
        details: expect.arrayContaining([
          expect.objectContaining({
            success: true,
            notification: expect.objectContaining({
              id: expect.any(String),
              ...validRawNotification,
            }),
          }),
        ]),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 207 when some notifications fail validation", async () => {
    req.body = [validRawNotification, invalidNotification];

    await controller.send(req as Request, res as Response, next);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      {
        ...validRawNotification,
        subject: {
          id: "user-123",
          name: "john.doe",
        },
      },
    ]);
    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Уведомления приняты частично: 1 принято, 1 отклонено",
        totalCount: 2,
        validCount: 1,
        invalidCount: 1,
        details: expect.arrayContaining([
          expect.objectContaining({
            success: true,
            notification: expect.objectContaining({
              id: expect.any(String),
              ...validRawNotification,
            }),
          }),
          expect.objectContaining({
            success: false,
            notification: invalidNotification,
            error: expect.any(Array),
          }),
        ]),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 400 when no notifications are valid", async () => {
    req.body = [invalidNotification, { recipients: ["bad"], message: "" }];

    await controller.send(req as Request, res as Response, next);

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
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next with error when use case throws an unexpected error", async () => {
    req.body = validRawNotification;

    const testError = new Error("Unexpected error");
    mockSendNotificationUseCase.send.mockRejectedValueOnce(testError);

    await controller.send(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(testError);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should call next with error when req.auth is missing", async () => {
    req.auth = undefined;
    req.body = validRawNotification;

    await controller.send(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          "Контроллер вызван без предварительной проверки аутентификации.",
      }),
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should call next with error when token payload is invalid", async () => {
    req.auth = {
      payload: {
        preferred_username: "john.doe",
      },
    };
    req.body = validRawNotification;

    await controller.send(req as Request, res as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining(
          "Не удалось извлечь данные об отправителе запроса",
        ),
      }),
    );
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 207 with multiple invalid notifications", async () => {
    const notif1: RawNotification = {
      ...validRawNotification,
      message: "Valid",
    };
    const notif2 = { recipients: [], message: "" };
    const notif3 = {
      recipients: [{ type: "email", value: 123 }],
      message: "Bad value",
    };

    req.body = [notif1, notif2, notif3];

    await controller.send(req as Request, res as Response, next);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      {
        ...notif1,
        subject: {
          id: "user-123",
          name: "john.doe",
        },
      },
    ]);
    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Уведомления приняты частично: 1 принято, 2 отклонено",
        totalCount: 3,
        validCount: 1,
        invalidCount: 2,
        details: expect.arrayContaining([
          expect.objectContaining({
            success: true,
            notification: expect.objectContaining(notif1),
          }),
          expect.objectContaining({ success: false, notification: notif2 }),
          expect.objectContaining({ success: false, notification: notif3 }),
        ]),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle single notification object", async () => {
    req.body = validRawNotification;

    await controller.send(req as Request, res as Response, next);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      {
        ...validRawNotification,
        subject: {
          id: "user-123",
          name: "john.doe",
        },
      },
    ]);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle array of notifications", async () => {
    const notif1: RawNotification = {
      ...validRawNotification,
      message: "Msg 1",
    };
    const notif2: RawNotification = {
      ...validRawNotification,
      message: "Msg 2",
    };
    req.body = [notif1, notif2];

    await controller.send(req as Request, res as Response, next);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      {
        ...notif1,
        subject: {
          id: "user-123",
          name: "john.doe",
        },
      },
      {
        ...notif2,
        subject: {
          id: "user-123",
          name: "john.doe",
        },
      },
    ]);
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 202 when all notifications are valid (array)", async () => {
    req.body = [validRawNotification];

    await controller.send(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("should use name fallback when preferred_username is missing", async () => {
    req.auth = {
      payload: {
        sub: "user-456",
        name: "Jane Smith",
      },
    };
    req.body = validRawNotification;

    await controller.send(req as Request, res as Response, next);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      {
        ...validRawNotification,
        subject: {
          id: "user-456",
          name: "Jane Smith",
        },
      },
    ]);
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle token with only sub field", async () => {
    req.auth = {
      payload: {
        sub: "user-789",
      },
    };
    req.body = validRawNotification;

    await controller.send(req as Request, res as Response, next);

    expect(mockSendNotificationUseCase.send).toHaveBeenCalledWith([
      {
        ...validRawNotification,
        subject: {
          id: "user-789",
          name: undefined,
        },
      },
    ]);
    expect(next).not.toHaveBeenCalled();
  });
});
