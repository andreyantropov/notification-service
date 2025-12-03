import { describe, it, expect, vi, beforeEach } from "vitest";

import { createHandleIncomingNotificationsUseCase } from "./createHandleIncomingNotificationsUseCase.js";
import { Notification, CHANNEL_TYPES } from "../../../domain/types/index.js";
import { Producer } from "../../ports/index.js";
import {
  NotificationDeliveryService,
  DeliveryResult,
} from "../../services/createNotificationDeliveryService/index.js";
import { IncomingNotification } from "../../types/index.js";

const createIncomingNotification = (
  message: string,
  isImmediate = false,
): IncomingNotification => ({
  contacts: [{ type: CHANNEL_TYPES.EMAIL, value: "user@example.com" }],
  message,
  isImmediate,
});

const mockProducer = (): Producer<Notification> => ({
  start: vi.fn(),
  publish: vi.fn(),
  shutdown: vi.fn(),
});

const mockDeliveryService = (): NotificationDeliveryService => ({
  send: vi.fn(),
  checkHealth: vi.fn(),
});

const expectNotification = (id: string, incoming: IncomingNotification) =>
  expect.objectContaining({
    id,
    createdAt: expect.stringMatching(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
    ),
    ...incoming,
  });

describe("createHandleIncomingNotificationsUseCase", () => {
  let producer: Producer<Notification>;
  let deliveryService: NotificationDeliveryService;

  beforeEach(() => {
    producer = mockProducer();
    deliveryService = mockDeliveryService();
    vi.clearAllMocks();
  });

  describe("handle", () => {
    it("should do nothing when notifications array is empty", async () => {
      const idGenerator = vi.fn();
      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([]);

      expect(idGenerator).not.toHaveBeenCalled();
      expect(producer.publish).not.toHaveBeenCalled();
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should batch non-urgent notifications", async () => {
      const notif1 = createIncomingNotification("Non-urgent 1", false);
      const notif2 = createIncomingNotification("Non-urgent 2", false);

      const idGenerator = vi.fn().mockReturnValue("test-id");
      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([notif1, notif2]);

      expect(producer.publish).toHaveBeenCalledTimes(1);
      expect(producer.publish).toHaveBeenCalledWith([
        expectNotification("test-id", notif1),
        expectNotification("test-id", notif2),
      ]);
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should not batch urgent notifications when all are delivered successfully", async () => {
      const notif1 = createIncomingNotification("Urgent 1", true);
      const notif2 = createIncomingNotification("Urgent 2", true);

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("id1")
        .mockReturnValueOnce("id2");

      const deliveryResults: DeliveryResult[] = [
        {
          success: true,
          notification: {
            id: "id1",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...notif1,
          },
        },
        {
          success: true,
          notification: {
            id: "id2",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...notif2,
          },
        },
      ];

      deliveryService.send = vi.fn().mockResolvedValue(deliveryResults);

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([notif1, notif2]);

      expect(deliveryService.send).toHaveBeenCalledWith([
        expectNotification("id1", notif1),
        expectNotification("id2", notif2),
      ]);
      expect(producer.publish).not.toHaveBeenCalled();
    });

    it("should batch failed urgent notifications for retry", async () => {
      const urgent1 = createIncomingNotification("Urgent 1", true);
      const urgent2 = createIncomingNotification("Urgent 2", true);

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("id1")
        .mockReturnValueOnce("id2");

      const deliveryResults: DeliveryResult[] = [
        {
          success: true,
          notification: {
            id: "id1",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...urgent1,
          },
        },
        {
          success: false,
          notification: {
            id: "id2",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...urgent2,
          },
        },
      ];

      deliveryService.send = vi.fn().mockResolvedValue(deliveryResults);

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([urgent1, urgent2]);

      expect(producer.publish).toHaveBeenCalledTimes(1);
      expect(producer.publish).toHaveBeenCalledWith([
        expectNotification("id2", urgent2),
      ]);
    });

    it("should handle mixed urgent and non-urgent notifications correctly", async () => {
      const urgent = createIncomingNotification("Urgent", true);
      const nonUrgent = createIncomingNotification("Non-urgent", false);

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("urgent-id")
        .mockReturnValueOnce("nonurgent-id");

      const deliveryResults: DeliveryResult[] = [
        {
          success: true,
          notification: {
            id: "urgent-id",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...urgent,
          },
        },
      ];

      deliveryService.send = vi.fn().mockResolvedValue(deliveryResults);

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([urgent, nonUrgent]);

      expect(producer.publish).toHaveBeenCalledTimes(1);
      expect(producer.publish).toHaveBeenCalledWith([
        expectNotification("nonurgent-id", nonUrgent),
      ]);
      expect(deliveryService.send).toHaveBeenCalledWith([
        expectNotification("urgent-id", urgent),
      ]);
    });

    it("should propagate error if batcher.append throws", async () => {
      const nonUrgent = createIncomingNotification("Non-urgent", false);
      const error = new Error("batcher failed");

      producer.publish = vi.fn().mockRejectedValue(error);
      const idGenerator = vi.fn().mockReturnValue("test-id");

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await expect(handle([nonUrgent])).rejects.toThrow("batcher failed");
    });

    it("should propagate error if delivery service throws", async () => {
      const urgent = createIncomingNotification("Urgent", true);
      const error = new Error("Send failed");

      deliveryService.send = vi.fn().mockRejectedValue(error);
      const idGenerator = vi.fn().mockReturnValue("test-id");

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await expect(handle([urgent])).rejects.toThrow("Send failed");
    });

    it("should return generated notifications", async () => {
      const notif = createIncomingNotification("Test", true);
      const idGenerator = vi.fn().mockReturnValue("returned-id");

      deliveryService.send = vi.fn().mockImplementation((notifications) =>
        Promise.resolve(
          notifications.map((n: Notification) => ({
            success: true,
            notification: n,
          })),
        ),
      );

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      const result = await handle([notif]);

      expect(result).toHaveLength(1);
      const [generated] = result;
      expect(generated).toEqual(
        expect.objectContaining({
          id: "returned-id",
          message: "Test",
          isImmediate: true,
          createdAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/,
          ),
        }),
      );
    });
  });
});
