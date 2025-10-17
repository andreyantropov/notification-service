import { describe, it, expect, vi, beforeEach } from "vitest";

import { createProcessBufferedNotificationsUseCase } from "./createProcessBufferedNotificationsUseCase.js";
import { Notification } from "../../../domain/types/Notification.js";
import { Buffer } from "../../ports/Buffer.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";
import { DeliveryResult } from "../../services/createNotificationDeliveryService/index.js";

describe("ProcessBufferedNotificationsUseCase", () => {
  let mockBuffer: Buffer<Notification>;
  let mockDeliveryService: NotificationDeliveryService;

  const createNotification = (id: string): Notification => ({
    id,
    contacts: [{ type: "email", value: "test@example.com" }],
    message: "Test message",
  });

  const createSendResult = (notification: Notification): DeliveryResult => ({
    success: true,
    notification,
    details: { messageId: "msg-123" },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do nothing when buffer is empty", async () => {
    mockBuffer = {
      takeAll: vi.fn().mockResolvedValue([]),
      append: vi.fn(),
    };
    mockDeliveryService = {
      send: vi.fn(),
    };

    const useCase = createProcessBufferedNotificationsUseCase({
      buffer: mockBuffer,
      notificationDeliveryService: mockDeliveryService,
    });

    await useCase.process();

    expect(mockBuffer.takeAll).toHaveBeenCalledTimes(1);
    expect(mockDeliveryService.send).not.toHaveBeenCalled();
  });

  it("should send notifications when buffer contains items", async () => {
    const notifications: Notification[] = [
      createNotification("1"),
      createNotification("2"),
    ];
    const sendResults: DeliveryResult[] = notifications.map(createSendResult);

    mockBuffer = {
      takeAll: vi.fn().mockResolvedValue(notifications),
      append: vi.fn(),
    };
    mockDeliveryService = {
      send: vi.fn().mockResolvedValue(sendResults),
    };

    const useCase = createProcessBufferedNotificationsUseCase({
      buffer: mockBuffer,
      notificationDeliveryService: mockDeliveryService,
    });

    await useCase.process();

    expect(mockBuffer.takeAll).toHaveBeenCalledTimes(1);
    expect(mockDeliveryService.send).toHaveBeenCalledTimes(1);
    expect(mockDeliveryService.send).toHaveBeenCalledWith(notifications);
  });
});
