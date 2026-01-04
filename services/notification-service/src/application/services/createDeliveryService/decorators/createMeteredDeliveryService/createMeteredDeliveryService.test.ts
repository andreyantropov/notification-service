import { describe, it, expect, vi, beforeEach } from "vitest";

import { createMeteredDeliveryService } from "./createMeteredDeliveryService.js";
import type { MeteredDeliveryServiceDependencies } from "./interfaces/index.js";
import { CHANNEL_TYPES } from "@notification-platform/shared";
import { DeliveryStrategy } from "@notification-platform/shared";
import type { Notification } from "@notification-platform/shared";
import type { Result, DeliveryService } from "../../interfaces/index.js";
import {
  NOTIFICATIONS_PROCESSED_TOTAL,
  NOTIFICATIONS_PROCESSED_BY_STATUS,
  NOTIFICATIONS_PROCESSED_BY_SUBJECT,
  NOTIFICATIONS_PROCESSED_BY_STRATEGY,
  NOTIFICATIONS_PROCESSED_BY_PRIORITY,
  DEFAULT_SUBJECT,
  DEFAULT_STRATEGY,
  DEFAULT_IS_IMMEDIATE,
} from "./constants/index.js";

const createMockMeter = () => ({
  increment: vi.fn<(name: string, labels?: Record<string, string>) => void>(),
  record: vi.fn(),
});

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
      meter: createMockMeter(),
    };

    meteredService = createMeteredDeliveryService(dependencies);
  });

  it("should return service with send and checkHealth methods", () => {
    expect(meteredService).toHaveProperty("send");
    expect(meteredService).toHaveProperty("checkHealth");
    expect(typeof meteredService.send).toBe("function");
    expect(typeof meteredService.checkHealth).toBe("function");
  });

  describe("send method - successful execution", () => {
    it("should record metrics for successful notifications with all attributes", async () => {
      const notifications = [
        createMockNotification({
          id: "notif-1",
          subject: { id: "user-123" },
          strategy: DeliveryStrategy.sendToAllAvailable,
          isImmediate: true,
        }),
      ];

      const results = [createMockDeliveryResult(notifications[0], "success")];
      mockDeliveryService.send.mockResolvedValue(results);

      const returnedResults = await meteredService.send(notifications);

      expect(returnedResults).toEqual(results);
      expect(dependencies.meter.increment).toHaveBeenCalledTimes(5);

      expect(dependencies.meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_TOTAL, undefined);
      expect(dependencies.meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_STATUS, { status: "success" });
      expect(dependencies.meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_SUBJECT, { subjectId: "user-123" });
      expect(dependencies.meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_STRATEGY, { strategy: DeliveryStrategy.sendToAllAvailable });
      expect(dependencies.meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_PRIORITY, { isImmediate: "true" });
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

      expect(dependencies.meter.increment).toHaveBeenCalledTimes(5);
      expect(dependencies.meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_SUBJECT, { subjectId: DEFAULT_SUBJECT });
      expect(dependencies.meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_STRATEGY, { strategy: DEFAULT_STRATEGY });
      expect(dependencies.meter.increment).toHaveBeenCalledWith(NOTIFICATIONS_PROCESSED_BY_PRIORITY, { isImmediate: String(DEFAULT_IS_IMMEDIATE) });
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

      expect(dependencies.meter.increment).toHaveBeenCalledTimes(10);

      const incrementCalls = (dependencies.meter.increment as ReturnType<typeof vi.fn>).mock.calls;
      const resultCalls = incrementCalls.filter(call => call[0] === NOTIFICATIONS_PROCESSED_BY_STATUS);

      expect(resultCalls).toEqual([
        [NOTIFICATIONS_PROCESSED_BY_STATUS, { status: "success" }],
        [NOTIFICATIONS_PROCESSED_BY_STATUS, { status: "failure" }],
      ]);
    });

    it("should process each notification exactly once", async () => {
      const notification = createMockNotification({ id: "duplicate-id" });
      const notifications = [notification, notification];

      const results = [
        createMockDeliveryResult(notification, "success"),
        createMockDeliveryResult(notification, "success"),
      ];
      mockDeliveryService.send.mockResolvedValue(results);

      await meteredService.send(notifications);

      expect(dependencies.meter.increment).toHaveBeenCalledTimes(10);
    });
  });
});