import { describe, it, expect, vi, beforeEach } from "vitest";

import { createSendNotificationUseCase } from "./createSendNotificationUseCase.js";
import { Notification } from "../../../domain/types/Notification.js";
import { Buffer } from "../../ports/Buffer.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";
import { RawNotification } from "../../types/RawNotification.js";

const createRawNotification = (
  message: string,
  isUrgent = false,
): RawNotification => ({
  recipients: [{ type: "email", value: "user@example.com" }],
  message,
  isUrgent,
});

const mockBuffer = (): Buffer<Notification> => ({
  append: vi.fn(),
  takeAll: vi.fn(),
});

const mockDeliveryService = (): NotificationDeliveryService => ({
  send: vi.fn(),
  checkHealth: vi.fn(),
});

describe("createSendNotificationUseCase", () => {
  let buffer: Buffer<Notification>;
  let deliveryService: NotificationDeliveryService;

  beforeEach(() => {
    buffer = mockBuffer();
    deliveryService = mockDeliveryService();
    vi.clearAllMocks();
  });

  describe("send", () => {
    it("should do nothing when notifications array is empty", async () => {
      const idGenerator = vi.fn();
      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await send([]);

      expect(idGenerator).not.toHaveBeenCalled();
      expect(buffer.append).not.toHaveBeenCalled();
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should buffer non-urgent notifications", async () => {
      const notif1 = createRawNotification("Non-urgent 1", false);
      const notif2 = createRawNotification("Non-urgent 2", false);

      const idGenerator = vi.fn().mockReturnValue("test-id");
      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await send([notif1, notif2]);

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
      const notif1 = createRawNotification("Urgent 1", true);
      const notif2 = createRawNotification("Urgent 2", true);

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("id1")
        .mockReturnValueOnce("id2");

      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await send([notif1, notif2]);

      expect(deliveryService.send).toHaveBeenCalledWith([
        { id: "id1", ...notif1 },
        { id: "id2", ...notif2 },
      ]);
      expect(buffer.append).not.toHaveBeenCalled();
    });

    it("should handle mixed urgent and non-urgent notifications correctly", async () => {
      const urgent = createRawNotification("Urgent", true);
      const nonUrgent = createRawNotification("Non-urgent", false);

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("urgent-id")
        .mockReturnValueOnce("nonurgent-id");

      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await send([urgent, nonUrgent]);

      expect(buffer.append).toHaveBeenCalledWith([
        { id: "nonurgent-id", ...nonUrgent },
      ]);
      expect(deliveryService.send).toHaveBeenCalledWith([
        { id: "urgent-id", ...urgent },
      ]);
    });

    it("should propagate error if buffer.append throws", async () => {
      const nonUrgent = createRawNotification("Non-urgent", false);
      const error = new Error("Buffer failed");

      buffer.append = vi.fn().mockRejectedValue(error);
      const idGenerator = vi.fn().mockReturnValue("test-id");

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await expect(send([nonUrgent])).rejects.toThrow("Buffer failed");
    });

    it("should propagate error if urgent notification delivery fails", async () => {
      const urgent = createRawNotification("Urgent", true);
      const error = new Error("Send failed");

      deliveryService.send = vi.fn().mockRejectedValue(error);
      const idGenerator = vi.fn().mockReturnValue("test-id");

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await expect(send([urgent])).rejects.toThrow("Send failed");
    });

    it("should handle single notification object", async () => {
      const notif = createRawNotification("Single", true);

      const idGenerator = vi.fn().mockReturnValue("single-id");
      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await send(notif);

      expect(deliveryService.send).toHaveBeenCalledWith([
        { id: "single-id", ...notif },
      ]);
    });

    it("should process only non-urgent notifications when no urgent present", async () => {
      const nonUrgent1 = createRawNotification("Non-urgent 1", false);
      const nonUrgent2 = createRawNotification("Non-urgent 2", false);

      const idGenerator = vi
        .fn()
        .mockReturnValueOnce("id1")
        .mockReturnValueOnce("id2");

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await send([nonUrgent1, nonUrgent2]);

      expect(buffer.append).toHaveBeenCalledWith([
        { id: "id1", ...nonUrgent1 },
        { id: "id2", ...nonUrgent2 },
      ]);
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should return generated notifications", async () => {
      const notif = createRawNotification("Test", true);
      const idGenerator = vi.fn().mockReturnValue("returned-id");

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      const result = await send(notif);

      expect(result).toEqual([{ id: "returned-id", ...notif }]);
    });
  });

  describe("checkHealth", () => {
    it("should not expose checkHealth if delivery service does not support it", () => {
      const deliveryServiceWithoutHealth = {
        send: vi.fn(),
      } satisfies NotificationDeliveryService;

      const useCase = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryServiceWithoutHealth,
        idGenerator: vi.fn(),
      });

      expect(useCase.checkHealth).toBeUndefined();
    });

    it("should call deliveryService.checkHealth if available", async () => {
      deliveryService.checkHealth = vi.fn().mockResolvedValue(undefined);
      const idGenerator = vi.fn();

      const { checkHealth } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await checkHealth?.();

      expect(deliveryService.checkHealth).toHaveBeenCalled();
    });

    it("should propagate error from deliveryService.checkHealth", async () => {
      const error = new Error("Health check failed");
      deliveryService.checkHealth = vi.fn().mockRejectedValue(error);
      const idGenerator = vi.fn();

      const { checkHealth } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        idGenerator,
      });

      await expect(checkHealth?.()).rejects.toThrow(error);
    });
  });
});
