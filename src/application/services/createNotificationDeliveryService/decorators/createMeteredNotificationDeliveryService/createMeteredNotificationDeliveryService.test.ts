import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMeteredNotificationDeliveryService } from "./createMeteredNotificationDeliveryService.js";
import { MeteredNotificationDeliveryServiceDependencies } from "./interfaces/index.js";
import {
  Notification,
  CHANNEL_TYPES,
  DELIVERY_STRATEGIES,
} from "../../../../../domain/types/index.js";
import {
  DeliveryResult,
  NotificationDeliveryService,
} from "../../interfaces/index.js";

const mockMeter = {
  incrementTotalNotifications: vi.fn(),
  incrementNotificationsProcessedByResult: vi.fn(),
  incrementNotificationsProcessedBySubject: vi.fn(),
  incrementNotificationsProcessedByStrategy: vi.fn(),
  incrementNotificationsByPriority: vi.fn(),
  recordChannelLatency: vi.fn(),
  incrementNotificationsByChannel: vi.fn(),
};

const mockNotificationDeliveryService = {
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
  strategy: DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE,
  subject: { id: "subject-1", name: "Test Subject" },
  ...overrides,
});

const createMockDeliveryResult = (
  notification: Notification,
  success: boolean,
): DeliveryResult => ({
  notification,
  success,
});

describe("createMeteredNotificationDeliveryService", () => {
  let dependencies: MeteredNotificationDeliveryServiceDependencies;
  let meteredService: NotificationDeliveryService;

  beforeEach(() => {
    vi.clearAllMocks();

    dependencies = {
      notificationDeliveryService: mockNotificationDeliveryService,
      meter: mockMeter,
    };

    meteredService = createMeteredNotificationDeliveryService(dependencies);
  });

  it("should return service with send and checkHealth methods", () => {
    expect(meteredService).toHaveProperty("send");
    expect(meteredService).toHaveProperty("checkHealth");
    expect(typeof meteredService.send).toBe("function");
    expect(typeof meteredService.checkHealth).toBe("function");
  });

  it("should delegate checkHealth calls to underlying service", async () => {
    const healthResult = { status: "healthy" };
    mockNotificationDeliveryService.checkHealth.mockResolvedValue(healthResult);

    const result = await meteredService.checkHealth!();

    expect(mockNotificationDeliveryService.checkHealth).toHaveBeenCalledOnce();
    expect(result).toEqual(healthResult);
  });

  describe("send method - successful execution", () => {
    it("should record metrics for successful notifications with all attributes", async () => {
      const notifications = [
        createMockNotification({
          id: "notif-1",
          subject: { id: "user-123" },
          strategy: DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE,
          isImmediate: true,
        }),
      ];

      const results = [createMockDeliveryResult(notifications[0], true)];

      mockNotificationDeliveryService.send.mockResolvedValue(results);

      const returnedResults = await meteredService.send(notifications);

      expect(returnedResults).toEqual(results);
      expect(mockMeter.incrementTotalNotifications).toHaveBeenCalledTimes(1);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenCalledWith("success");
      expect(
        mockMeter.incrementNotificationsProcessedBySubject,
      ).toHaveBeenCalledWith("user-123");
      expect(
        mockMeter.incrementNotificationsProcessedByStrategy,
      ).toHaveBeenCalledWith(DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE);
      expect(mockMeter.incrementNotificationsByPriority).toHaveBeenCalledWith(
        true,
      );
    });

    it("should handle notifications with missing optional fields", async () => {
      const notifications = [
        createMockNotification({
          subject: undefined,
          strategy: undefined,
          isImmediate: undefined,
        }),
      ];

      const results = [createMockDeliveryResult(notifications[0], true)];

      mockNotificationDeliveryService.send.mockResolvedValue(results);

      await meteredService.send(notifications);

      expect(mockMeter.incrementTotalNotifications).toHaveBeenCalledTimes(1);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenCalledWith("success");
      expect(
        mockMeter.incrementNotificationsProcessedBySubject,
      ).toHaveBeenCalledWith("unknown");
      expect(
        mockMeter.incrementNotificationsProcessedByStrategy,
      ).toHaveBeenCalledWith(DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE);
      expect(mockMeter.incrementNotificationsByPriority).toHaveBeenCalledWith(
        false,
      );
    });

    it("should handle mixed success and failure results", async () => {
      const notifications = [
        createMockNotification({ id: "notif-1" }),
        createMockNotification({ id: "notif-2" }),
      ];

      const results = [
        createMockDeliveryResult(notifications[0], true),
        createMockDeliveryResult(notifications[1], false),
      ];

      mockNotificationDeliveryService.send.mockResolvedValue(results);

      await meteredService.send(notifications);

      expect(mockMeter.incrementTotalNotifications).toHaveBeenCalledTimes(2);
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
        createMockDeliveryResult(notification, true),
        createMockDeliveryResult(notification, true),
      ];

      mockNotificationDeliveryService.send.mockResolvedValue(results);

      await meteredService.send(notifications);

      expect(mockMeter.incrementTotalNotifications).toHaveBeenCalledTimes(2);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockMeter.incrementNotificationsProcessedBySubject,
      ).toHaveBeenCalledTimes(2);
      expect(
        mockMeter.incrementNotificationsProcessedByStrategy,
      ).toHaveBeenCalledTimes(2);
      expect(mockMeter.incrementNotificationsByPriority).toHaveBeenCalledTimes(
        2,
      );
    });
  });

  describe("send method - error handling", () => {
    it("should record metrics and re-throw error when underlying service fails", async () => {
      const notifications = [
        createMockNotification({
          id: "notif-1",
          subject: { id: "user-456" },
          strategy: DELIVERY_STRATEGIES.SEND_TO_ALL_AVAILABLE,
          isImmediate: false,
        }),
      ];

      const testError = new Error("Service unavailable");
      mockNotificationDeliveryService.send.mockRejectedValue(testError);

      await expect(meteredService.send(notifications)).rejects.toThrow(
        "Service unavailable",
      );

      expect(mockMeter.incrementTotalNotifications).toHaveBeenCalledTimes(1);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenCalledWith("failure");
      expect(
        mockMeter.incrementNotificationsProcessedBySubject,
      ).toHaveBeenCalledWith("user-456");
      expect(
        mockMeter.incrementNotificationsProcessedByStrategy,
      ).toHaveBeenCalledWith(DELIVERY_STRATEGIES.SEND_TO_ALL_AVAILABLE);
      expect(mockMeter.incrementNotificationsByPriority).toHaveBeenCalledWith(
        false,
      );
    });

    it("should handle empty notifications array in error case", async () => {
      const notifications: Notification[] = [];
      const testError = new Error("No notifications");
      mockNotificationDeliveryService.send.mockRejectedValue(testError);

      await expect(meteredService.send(notifications)).rejects.toThrow(
        "No notifications",
      );

      expect(mockMeter.incrementTotalNotifications).toHaveBeenCalledTimes(0);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenCalledTimes(0);
    });

    it("should record correct default values when first notification has missing fields in error case", async () => {
      const notifications = [
        createMockNotification({
          subject: undefined,
          strategy: undefined,
          isImmediate: undefined,
        }),
      ];

      const testError = new Error("Test error");
      mockNotificationDeliveryService.send.mockRejectedValue(testError);

      await expect(meteredService.send(notifications)).rejects.toThrow(
        "Test error",
      );

      expect(mockMeter.incrementTotalNotifications).toHaveBeenCalledTimes(1);
      expect(
        mockMeter.incrementNotificationsProcessedByResult,
      ).toHaveBeenCalledWith("failure");
      expect(
        mockMeter.incrementNotificationsProcessedBySubject,
      ).toHaveBeenCalledWith("unknown");
      expect(
        mockMeter.incrementNotificationsProcessedByStrategy,
      ).toHaveBeenCalledWith(DELIVERY_STRATEGIES.SEND_TO_FIRST_AVAILABLE);
      expect(mockMeter.incrementNotificationsByPriority).toHaveBeenCalledWith(
        false,
      );
    });
  });
});
