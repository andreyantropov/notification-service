import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMeteredDeliveryService } from "./createMeteredDeliveryService.js";
import type { MeteredDeliveryServiceDependencies } from "./interfaces/index.js";
import { CHANNEL_TYPES } from "../../../../../domain/constants/index.js";
import { DeliveryStrategy } from "../../../../../domain/enums/DeliveryStrategy.js";
import type { Notification } from "../../../../../domain/types/index.js";
import type { Result, DeliveryService } from "../../interfaces/index.js";

const mockMeter = {
  incrementNotificationsProcessedTotal: vi.fn(),
  incrementNotificationsProcessedByResult: vi.fn(),
  incrementNotificationsProcessedBySubject: vi.fn(),
  incrementNotificationsProcessedByStrategy: vi.fn(),
  incrementNotificationsProcessedByPriority: vi.fn(),
  recordChannelLatency: vi.fn(),
  incrementNotificationsProcessedByChannel: vi.fn(),
  incrementRetryRoutingByQueue: vi.fn(),
};

const mockDeliveryService = {
  send: vi.fn(),
  checkHealth: vi.fn(),
};

const createMockNotification = (
  overrides?: Partial<Notification>,
): Notification => ({
  id: "test-notification-1",
  createdAt: "2023-01-01T00:00:00Z",
  contacts: [
    { type: CHANNEL_TYPES.EMAIL, value: "test@example.com" },
    { type: CHANNEL_TYPES.BITRIX, value: 12345 },
  ],
  message: "Test message",
  isImmediate: false,
  strategy: DeliveryStrategy.sendToFirstAvailable,
  subject: { id: "subject-1", name: "Test Subject" },
  ...overrides,
});

const createMockDeliveryResult = (
  notification: Notification,
  status: "success" | "failure",
): Result => ({
  notification,
  status,
});

describe("createMeteredDeliveryService", () => {
  let dependencies: MeteredDeliveryServiceDependencies;
  let meteredService: DeliveryService;

  beforeEach(() => {
    vi.clearAllMocks();

    dependencies = {
      deliveryService: mockDeliveryService,
      meter: mockMeter,
    };

    meteredService = createMeteredDeliveryService(dependencies);
  });

  it("should return service with send and checkHealth methods", () => {
    expect(meteredService).toHaveProperty("send");
    expect(meteredService).toHaveProperty("checkHealth");
    expect(typeof meteredService.send).toBe("function");
    expect(typeof meteredService.checkHealth).toBe("function");
  });

  it("should delegate checkHealth calls to underlying service", async () => {
    const healthResult = { status: "healthy" };
    mockDeliveryService.checkHealth.mockResolvedValue(healthResult);

    const result = await meteredService.checkHealth!();

    expect(mockDeliveryService.checkHealth).toHaveBeenCalledOnce();
    expect(result).toEqual(healthResult);
  });

  describe("send method - successful execution", () => {
    it("should record metrics for successful notifications with all attributes", async () => {
      const notifications = [
        createMockNotification({
          id: "notif-1",
          subject: { id: "user-123" },
          strategy: DeliveryStrategy.sendToFirstAvailable,
          isImmediate: true,
        }),
      ];

      const results = [createMockDeliveryResult(notifications[0], "success")];

      mockDeliveryService.send.mockResolvedValue(results);

      const returnedResults = await meteredService.send(notifications);

      expect(returnedResults).toEqual(results);
      expect(
        mockMeter.incrementNotificationsProcessedTotal,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenCalledWith("success");
      expect(
        mockMeter.incrementNotificationsProcessedBySubject,
      ).toHaveBeenCalledWith("user-123");
      expect(
        mockMeter.incrementNotificationsProcessedByStrategy,
      ).toHaveBeenCalledWith(DeliveryStrategy.sendToFirstAvailable);
      expect(
        mockMeter.incrementNotificationsProcessedByPriority,
      ).toHaveBeenCalledWith(true);
    });

    it("should handle notifications with missing optional fields", async () => {
      const notifications = [
        createMockNotification({
          subject: undefined,
          strategy: undefined,
          isImmediate: undefined,
        }),
      ];

      const results = [createMockDeliveryResult(notifications[0], "success")];

      mockDeliveryService.send.mockResolvedValue(results);

      await meteredService.send(notifications);

      expect(
        mockMeter.incrementNotificationsProcessedTotal,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenCalledWith("success");
      expect(
        mockMeter.incrementNotificationsProcessedBySubject,
      ).toHaveBeenCalledWith("unknown");
      expect(
        mockMeter.incrementNotificationsProcessedByStrategy,
      ).toHaveBeenCalledWith(DeliveryStrategy.sendToFirstAvailable);
      expect(
        mockMeter.incrementNotificationsProcessedByPriority,
      ).toHaveBeenCalledWith(false);
    });

    it("should handle mixed success and failure results", async () => {
      const notifications = [
        createMockNotification({ id: "notif-1" }),
        createMockNotification({ id: "notif-2" }),
      ];

      const results = [
        createMockDeliveryResult(notifications[0], "success"),
        createMockDeliveryResult(notifications[1], "failure"),
      ];

      mockDeliveryService.send.mockResolvedValue(results);

      await meteredService.send(notifications);

      expect(
        mockMeter.incrementNotificationsProcessedTotal,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenNthCalledWith(1, "success");
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenNthCalledWith(2, "failure");
    });

    it("should process each notification only once even if they have same id", async () => {
      const notification = createMockNotification({ id: "duplicate-id" });
      const notifications = [notification, notification];

      const results = [
        createMockDeliveryResult(notification, "success"),
        createMockDeliveryResult(notification, "success"),
      ];

      mockDeliveryService.send.mockResolvedValue(results);

      await meteredService.send(notifications);

      expect(
        mockMeter.incrementNotificationsProcessedTotal,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockMeter.incrementNotificationsProcessedBySubject,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockMeter.incrementNotificationsProcessedByStrategy,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockMeter.incrementNotificationsProcessedByPriority,
      ).toHaveBeenCalledTimes(2);
    });
  });
});
