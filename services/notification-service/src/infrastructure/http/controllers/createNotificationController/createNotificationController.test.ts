import type { Request, Response } from "express";
import { TimeoutError } from "p-timeout";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { createNotificationController } from "./createNotificationController.js";
import type { IncomingNotification } from "../../../../application/types/index.js";
import { CHANNEL_TYPES } from "@notification-platform/shared";
import type {
  Notification,
  Contact,
  Subject,
} from "@notification-platform/shared";

const emailContact: Contact = {
  type: CHANNEL_TYPES.EMAIL,
  value: "user1@example.com",
};

const validIncomingNotification: IncomingNotification = {
  contacts: [emailContact],
  message: "Привет!",
  isImmediate: true,
};

const invalidNotification = {
  contacts: [],
  message: "",
};

const mockHandleIncomingNotificationsUseCase = {
  handle: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();

    mockHandleIncomingNotificationsUseCase.handle.mockImplementation(
      (notifications: readonly IncomingNotification[], subject?: Subject) => {
        const list = Array.isArray(notifications)
          ? notifications
          : [notifications];
        const result: Notification[] = list.map((item, i) => ({
          id: `generated-id-${i}`,
          createdAt: "2025-01-01T00:00:00.000Z",
          ...item,
          ...(subject && { subject }),
        }));
        return Promise.resolve(result);
      },
    );

    controller = createNotificationController({
      handleIncomingNotificationsUseCase:
        mockHandleIncomingNotificationsUseCase,
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
  });

  it("should return 202 when all notifications are valid", async () => {
    req.body = validIncomingNotification;

    await controller.handle(req as Request, res as Response);

    expect(mockHandleIncomingNotificationsUseCase.handle).toHaveBeenCalledWith(
      [validIncomingNotification],
      { id: "user-123", name: "john.doe" },
    );
    expect(res.status).toHaveBeenCalledWith(202);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Все уведомления приняты в обработку",
        acceptedCount: 1,
        rejectedCount: 0,
        details: expect.arrayContaining([
          expect.objectContaining({
            status: "success",
            notification: expect.objectContaining({
              id: expect.any(String),
              ...validIncomingNotification,
            }),
          }),
        ]),
      }),
    );
  });

  it("should return 207 when some notifications fail validation", async () => {
    req.body = [validIncomingNotification, invalidNotification];

    await controller.handle(req as Request, res as Response);

    expect(mockHandleIncomingNotificationsUseCase.handle).toHaveBeenCalledWith(
      [validIncomingNotification],
      { id: "user-123", name: "john.doe" },
    );
    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Уведомления приняты частично: 1 принято, 1 отклонено",
        totalCount: 2,
        acceptedCount: 1,
        rejectedCount: 1,
        details: expect.arrayContaining([
          expect.objectContaining({
            status: "success",
            notification: expect.objectContaining(validIncomingNotification),
          }),
          expect.objectContaining({
            status: "failure",
            notification: invalidNotification,
            error: expect.any(Array),
          }),
        ]),
      }),
    );
  });

  it("should return 400 when no notifications are valid", async () => {
    req.body = [invalidNotification, { contacts: ["bad"], message: "" }];

    await controller.handle(req as Request, res as Response);

    expect(
      mockHandleIncomingNotificationsUseCase.handle,
    ).not.toHaveBeenCalled();
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

  it("should propagate non-timeout errors to be handled by 500 middleware", async () => {
    req.body = validIncomingNotification;

    const testError = new Error("Unexpected error");
    mockHandleIncomingNotificationsUseCase.handle.mockRejectedValueOnce(
      testError,
    );

    await expect(
      controller.handle(req as Request, res as Response),
    ).rejects.toThrow(testError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should process without subject when req.auth is missing", async () => {
    req.auth = undefined;
    req.body = validIncomingNotification;

    await controller.handle(req as Request, res as Response);

    expect(mockHandleIncomingNotificationsUseCase.handle).toHaveBeenCalledWith(
      [validIncomingNotification],
      undefined,
    );
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("should throw error when token payload is invalid", async () => {
    req.auth = {
      payload: {
        preferred_username: "john.doe",
      },
    };
    req.body = validIncomingNotification;

    await expect(
      controller.handle(req as Request, res as Response),
    ).rejects.toThrow("Не удалось извлечь данные об отправителе запроса");

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it("should return 207 with multiple invalid notifications", async () => {
    const notif1: IncomingNotification = {
      ...validIncomingNotification,
      message: "Valid",
    };
    const notif2 = { contacts: [], message: "" };
    const notif3 = {
      contacts: [{ type: CHANNEL_TYPES.EMAIL, value: 123 }],
      message: "Bad value",
    };

    req.body = [notif1, notif2, notif3];

    await controller.handle(req as Request, res as Response);

    expect(mockHandleIncomingNotificationsUseCase.handle).toHaveBeenCalledWith(
      [notif1],
      { id: "user-123", name: "john.doe" },
    );
    expect(res.status).toHaveBeenCalledWith(207);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Уведомления приняты частично: 1 принято, 2 отклонено",
        totalCount: 3,
        acceptedCount: 1,
        rejectedCount: 2,
        details: expect.arrayContaining([
          expect.objectContaining({
            status: "success",
            notification: expect.objectContaining(notif1),
          }),
          expect.objectContaining({ status: "failure", notification: notif2 }),
          expect.objectContaining({ status: "failure", notification: notif3 }),
        ]),
      }),
    );
  });

  it("should handle single notification object", async () => {
    req.body = validIncomingNotification;

    await controller.handle(req as Request, res as Response);

    expect(mockHandleIncomingNotificationsUseCase.handle).toHaveBeenCalledWith(
      [validIncomingNotification],
      expect.objectContaining({ id: "user-123" }),
    );
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("should handle array of notifications", async () => {
    const notif1 = { ...validIncomingNotification, message: "Msg 1" };
    const notif2 = { ...validIncomingNotification, message: "Msg 2" };
    req.body = [notif1, notif2];

    await controller.handle(req as Request, res as Response);

    expect(mockHandleIncomingNotificationsUseCase.handle).toHaveBeenCalledWith(
      [notif1, notif2],
      expect.objectContaining({ id: "user-123" }),
    );
    expect(res.status).toHaveBeenCalledWith(202);
  });

  it("should use name fallback when preferred_username is missing", async () => {
    req.auth = {
      payload: {
        sub: "user-456",
        name: "Jane Smith",
      },
    };
    req.body = validIncomingNotification;

    await controller.handle(req as Request, res as Response);

    expect(mockHandleIncomingNotificationsUseCase.handle).toHaveBeenCalledWith(
      [validIncomingNotification],
      { id: "user-456", name: "Jane Smith" },
    );
  });

  it("should handle token with only sub field", async () => {
    req.auth = {
      payload: {
        sub: "user-789",
      },
    };
    req.body = validIncomingNotification;

    await controller.handle(req as Request, res as Response);

    expect(mockHandleIncomingNotificationsUseCase.handle).toHaveBeenCalledWith(
      [validIncomingNotification],
      { id: "user-789", name: undefined },
    );
  });

  it("should throw TimeoutError if handleIncomingNotificationsUseCase hangs", async () => {
    vi.useFakeTimers();

    mockHandleIncomingNotificationsUseCase.handle.mockReturnValue(
      new Promise(() => { }),
    );

    req.body = validIncomingNotification;

    const sendPromise = controller.handle(req as Request, res as Response);

    vi.advanceTimersByTime(60_001);

    await expect(sendPromise).rejects.toBeInstanceOf(TimeoutError);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();

    vi.useRealTimers();
  });
});
