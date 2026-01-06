import { describe, it, expect, vi, beforeEach } from "vitest";

import { createHandleIncomingNotificationsUseCase } from "./createHandleIncomingNotificationsUseCase.js";
import { CHANNEL_TYPES } from "@notification-platform/shared";
import type { Notification, Subject, Producer } from "@notification-platform/shared";
import type {
  DeliveryService,
  Result,
} from "../../services/createDeliveryService/index.js";
import type { IncomingNotification } from "../../types/index.js";

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
  checkHealth: vi.fn(),
});

const expectNotification = (
  id: string,
  incoming: IncomingNotification,
  subject?: Subject,
) => {
  const expected: Partial<Notification> = {
    id,
    createdAt: expect.stringMatching(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    ),
    ...incoming,
    ...(subject && { subject }),
  };
  return expect.objectContaining(expected);
};

describe("createHandleIncomingNotificationsUseCase", () => {
  let producer: Producer<Notification>;

  beforeEach(() => {
    producer = mockProducer();
    vi.clearAllMocks();
  });

  describe("handle", () => {
    it("should do nothing when notifications array is empty", async () => {
      const idGenerator = vi.fn();
      const deliveryService: DeliveryService = {
        send: vi.fn(),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
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
      const deliveryService: DeliveryService = {
        send: vi.fn(),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
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

      const results: Result[] = [
        {
          status: "success",
          notification: {
            id: "id1",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...notif1,
          },
        },
        {
          status: "success",
          notification: {
            id: "id2",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...notif2,
          },
        },
      ];

      const deliveryService: DeliveryService = {
        send: vi.fn().mockResolvedValue(results),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
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

      const results: Result[] = [
        {
          status: "success",
          notification: {
            id: "id1",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...urgent1,
          },
        },
        {
          status: "failure",
          notification: {
            id: "id2",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...urgent2,
          },
        },
      ];

      const deliveryService: DeliveryService = {
        send: vi.fn().mockResolvedValue(results),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
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

      const results: Result[] = [
        {
          status: "success",
          notification: {
            id: "urgent-id",
            createdAt: "2025-01-01T00:00:00.000Z",
            ...urgent,
          },
        },
      ];

      const deliveryService: DeliveryService = {
        send: vi.fn().mockResolvedValue(results),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
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

      const publishMock = vi.fn().mockRejectedValue(error);
      const producer: Producer<Notification> = {
        start: vi.fn(),
        publish: publishMock,
        shutdown: vi.fn(),
        checkHealth: vi.fn(),
      };

      const idGenerator = vi.fn().mockReturnValue("test-id");
      const deliveryService: DeliveryService = {
        send: vi.fn(),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
        idGenerator,
      });

      await expect(handle([nonUrgent])).rejects.toThrow("batcher failed");
    });

    it("should propagate error if delivery service throws", async () => {
      const urgent = createIncomingNotification("Urgent", true);
      const error = new Error("Send failed");

      const deliveryService: DeliveryService = {
        send: vi.fn().mockRejectedValue(error),
        checkHealth: vi.fn(),
      };
      const idGenerator = vi.fn().mockReturnValue("test-id");

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
        idGenerator,
      });

      await expect(handle([urgent])).rejects.toThrow("Send failed");
    });

    it("should return generated notifications", async () => {
      const notif = createIncomingNotification("Test", true);
      const idGenerator = vi.fn().mockReturnValue("returned-id");

      const deliveryService: DeliveryService = {
        send: vi.fn().mockImplementation((notifications) =>
          Promise.resolve(
            notifications.map((n: Notification) => ({
              status: "success",
              notification: n,
            })),
          ),
        ),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
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
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
        }),
      );
    });

    it("should enrich notifications with subject when provided", async () => {
      const notif = createIncomingNotification("Test with subject");
      const subject: Subject = { id: "user-123", name: "john.doe" };
      const idGenerator = vi.fn().mockReturnValue("test-id");
      const deliveryService: DeliveryService = {
        send: vi.fn().mockResolvedValue([]),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
        idGenerator,
      });

      const result = await handle([notif], subject);

      expect(result[0]).toEqual(expectNotification("test-id", notif, subject));
      expect(producer.publish).toHaveBeenCalledWith([
        expectNotification("test-id", notif, subject),
      ]);
    });

    it("should not include subject field when not provided", async () => {
      const notif = createIncomingNotification("Test without subject");
      const idGenerator = vi.fn().mockReturnValue("test-id");
      const deliveryService: DeliveryService = {
        send: vi.fn().mockResolvedValue([]),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
        idGenerator,
      });

      const result = await handle([notif]);

      expect(Object.hasOwn(result[0], "subject")).toBe(false);
      expect(result[0]).toEqual(
        expectNotification("test-id", notif, undefined),
      );
    });

    it("should handle mixed urgent/non-urgent with subject correctly", async () => {
      const urgent = createIncomingNotification("Urgent", true);
      const nonUrgent = createIncomingNotification("Non-urgent", false);
      const subject: Subject = { id: "user-456", name: "jane.smith" };

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("urgent-id")
        .mockReturnValueOnce("nonurgent-id");

      const deliveryService: DeliveryService = {
        send: vi.fn().mockResolvedValue([
          {
            status: "success",
            notification: expectNotification("urgent-id", urgent, subject),
          },
        ]),
        checkHealth: vi.fn(),
      };

      const { handle } = createHandleIncomingNotificationsUseCase({
        producer,
        deliveryService,
        idGenerator,
      });

      await handle([urgent, nonUrgent], subject);

      expect(deliveryService.send).toHaveBeenCalledWith([
        expectNotification("urgent-id", urgent, subject),
      ]);
      expect(producer.publish).toHaveBeenCalledWith([
        expectNotification("nonurgent-id", nonUrgent, subject),
      ]);
    });
  });
});
