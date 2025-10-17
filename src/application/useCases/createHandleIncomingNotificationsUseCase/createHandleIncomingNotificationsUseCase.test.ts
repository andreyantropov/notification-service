import { describe, it, expect, vi, beforeEach } from "vitest";

import { createHandleIncomingNotificationsUseCase } from "./createHandleIncomingNotificationsUseCase.js";
import { Notification } from "../../../domain/types/Notification.js";
import { Buffer } from "../../ports/Buffer.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";
import { IncomingNotification } from "../../types/IncomingNotification.js";

const createIncomingNotification = (
  message: string,
  isImmediate = false,
): IncomingNotification => ({
  contacts: [{ type: "email", value: "user@example.com" }],
  message,
  isImmediate,
});

const mockBuffer = (): Buffer<Notification> => ({
  append: vi.fn(),
  takeAll: vi.fn(),
});

const mockDeliveryService = (): NotificationDeliveryService => ({
  send: vi.fn(),
  checkHealth: vi.fn(),
});

describe("createHandleIncomingNotificationsUseCase", () => {
  let buffer: Buffer<Notification>;
  let deliveryService: NotificationDeliveryService;

  beforeEach(() => {
    buffer = mockBuffer();
    deliveryService = mockDeliveryService();
    vi.clearAllMocks();
  });

  describe("handle", () => {
    it("should do nothing when notifications array is empty", async () => {
      const idGenerator = vi.fn();
      const { handle } = createHandleIncomingNotificationsUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([]);

      expect(idGenerator).not.toHaveBeenCalled();
      expect(buffer.append).not.toHaveBeenCalled();
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should buffer non-urgent notifications", async () => {
      const notif1 = createIncomingNotification("Non-urgent 1", false);
      const notif2 = createIncomingNotification("Non-urgent 2", false);

      const idGenerator = vi.fn().mockReturnValue("test-id");
      const { handle } = createHandleIncomingNotificationsUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([notif1, notif2]);

      expect(idGenerator).toHaveBeenCalledTimes(2);

      expect(buffer.append).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: "test-id", ...notif1 }),
          expect.objectContaining({ id: "test-id", ...notif2 }),
        ]),
      );
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should send urgent notifications immediately", async () => {
      const notif1 = createIncomingNotification("Urgent 1", true);
      const notif2 = createIncomingNotification("Urgent 2", true);

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("id1")
        .mockReturnValueOnce("id2");

      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { handle } = createHandleIncomingNotificationsUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([notif1, notif2]);

      expect(deliveryService.send).toHaveBeenCalledWith([
        { id: "id1", ...notif1 },
        { id: "id2", ...notif2 },
      ]);
      expect(buffer.append).not.toHaveBeenCalled();
    });

    it("should handle mixed urgent and non-urgent notifications correctly", async () => {
      const urgent = createIncomingNotification("Urgent", true);
      const nonUrgent = createIncomingNotification("Non-urgent", false);

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("urgent-id")
        .mockReturnValueOnce("nonurgent-id");

      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { handle } = createHandleIncomingNotificationsUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([urgent, nonUrgent]);

      expect(buffer.append).toHaveBeenCalledWith([
        { id: "nonurgent-id", ...nonUrgent },
      ]);
      expect(deliveryService.send).toHaveBeenCalledWith([
        { id: "urgent-id", ...urgent },
      ]);
    });

    it("should propagate error if buffer.append throws", async () => {
      const nonUrgent = createIncomingNotification("Non-urgent", false);
      const error = new Error("Buffer failed");

      buffer.append = vi.fn().mockRejectedValue(error);
      const idGenerator = vi.fn().mockReturnValue("test-id");

      const { handle } = createHandleIncomingNotificationsUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await expect(handle([nonUrgent])).rejects.toThrow("Buffer failed");
    });

    it("should propagate error if urgent notification delivery fails", async () => {
      const urgent = createIncomingNotification("Urgent", true);
      const error = new Error("Send failed");

      deliveryService.send = vi.fn().mockRejectedValue(error);
      const idGenerator = vi.fn().mockReturnValue("test-id");

      const { handle } = createHandleIncomingNotificationsUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await expect(handle([urgent])).rejects.toThrow("Send failed");
    });

    it("should process only non-urgent notifications when no urgent present", async () => {
      const nonUrgent1 = createIncomingNotification("Non-urgent 1", false);
      const nonUrgent2 = createIncomingNotification("Non-urgent 2", false);

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("id1")
        .mockReturnValueOnce("id2");

      const { handle } = createHandleIncomingNotificationsUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await handle([nonUrgent1, nonUrgent2]);

      expect(buffer.append).toHaveBeenCalledWith([
        { id: "id1", ...nonUrgent1 },
        { id: "id2", ...nonUrgent2 },
      ]);
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should return generated notifications", async () => {
      const notif = createIncomingNotification("Test", true);
      const idGenerator = vi.fn().mockReturnValue("returned-id");

      const { handle } = createHandleIncomingNotificationsUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      const result = await handle([notif]);

      expect(result).toEqual([{ id: "returned-id", ...notif }]);
    });
  });
});
