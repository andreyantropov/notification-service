import { describe, it, expect, vi, beforeEach } from "vitest";

import { createSendNotificationUseCase } from "./createSendNotificationUseCase.js";
import { Notification } from "../../../domain/types/Notification.js";
import { Buffer } from "../../ports/Buffer.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";

const mockNotification = (message: string, isUrgent = false): Notification => ({
  recipients: [{ type: "email", value: "user@com" }],
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
      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send([]);

      expect(buffer.append).not.toHaveBeenCalled();
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should buffer non-urgent notifications", async () => {
      const notif1 = mockNotification("Non-urgent 1", false);
      const notif2 = mockNotification("Non-urgent 2", false);
      const notifications = [notif1, notif2];

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send(notifications);

      expect(buffer.append).toHaveBeenCalledWith([notif1, notif2]);
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should send urgent notifications immediately", async () => {
      const notif1 = mockNotification("Urgent 1", true);
      const notif2 = mockNotification("Urgent 2", true);

      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send([notif1, notif2]);

      expect(deliveryService.send).toHaveBeenCalledWith([notif1, notif2]);
      expect(buffer.append).not.toHaveBeenCalled();
    });

    it("should handle mixed urgent and non-urgent notifications correctly", async () => {
      const urgent = mockNotification("Urgent", true);
      const nonUrgent = mockNotification("Non-urgent", false);
      const notifications = [urgent, nonUrgent];

      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send(notifications);

      expect(buffer.append).toHaveBeenCalledWith([nonUrgent]);
      expect(deliveryService.send).toHaveBeenCalledWith([urgent]);
    });

    it("should propagate error if buffer.append throws", async () => {
      const nonUrgent = mockNotification("Non-urgent", false);
      const error = new Error("Buffer failed");

      buffer.append = vi.fn().mockRejectedValue(error);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await expect(send([nonUrgent])).rejects.toThrow("Buffer failed");
    });

    it("should propagate error if urgent notification delivery fails", async () => {
      const urgent = mockNotification("Urgent", true);
      const error = new Error("Send failed");

      deliveryService.send = vi.fn().mockRejectedValue(error);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await expect(send([urgent])).rejects.toThrow("Send failed");
    });

    it("should handle single notification object", async () => {
      const notif = mockNotification("Single", true);

      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send(notif);

      expect(deliveryService.send).toHaveBeenCalledWith([notif]);
    });

    it("should buffer non-urgent notifications and not send them", async () => {
      const nonUrgent = mockNotification("Non-urgent", false);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send([nonUrgent]);

      expect(buffer.append).toHaveBeenCalledWith([nonUrgent]);
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should send urgent notifications and not buffer them", async () => {
      const urgent = mockNotification("Urgent", true);

      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send([urgent]);

      expect(buffer.append).not.toHaveBeenCalled();
      expect(deliveryService.send).toHaveBeenCalledWith([urgent]);
    });

    it("should handle empty array when filtering notifications", async () => {
      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send([]);

      expect(buffer.append).not.toHaveBeenCalled();
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should process only urgent notifications when no non-urgent present", async () => {
      const urgent1 = mockNotification("Urgent 1", true);
      const urgent2 = mockNotification("Urgent 2", true);

      deliveryService.send = vi.fn().mockResolvedValue([]);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send([urgent1, urgent2]);

      expect(deliveryService.send).toHaveBeenCalledWith([urgent1, urgent2]);
      expect(buffer.append).not.toHaveBeenCalled();
    });

    it("should process only non-urgent notifications when no urgent present", async () => {
      const nonUrgent1 = mockNotification("Non-urgent 1", false);
      const nonUrgent2 = mockNotification("Non-urgent 2", false);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await send([nonUrgent1, nonUrgent2]);

      expect(buffer.append).toHaveBeenCalledWith([nonUrgent1, nonUrgent2]);
      expect(deliveryService.send).not.toHaveBeenCalled();
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
      });

      expect(useCase.checkHealth).toBeUndefined();
    });

    it("should call deliveryService.checkHealth if available", async () => {
      deliveryService.checkHealth = vi.fn().mockResolvedValue(undefined);

      const { checkHealth } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await checkHealth?.();

      expect(deliveryService.checkHealth).toHaveBeenCalled();
    });

    it("should propagate error from deliveryService.checkHealth", async () => {
      const error = new Error("Health check failed");
      deliveryService.checkHealth = vi.fn().mockRejectedValue(error);

      const { checkHealth } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      await expect(checkHealth?.()).rejects.toThrow(error);
    });

    it("should return void when health check succeeds", async () => {
      deliveryService.checkHealth = vi.fn().mockResolvedValue(undefined);

      const { checkHealth } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      const result = await checkHealth?.();

      expect(result).toBeUndefined();
    });
  });

  describe("returned interface", () => {
    it("should always return send method", () => {
      const useCase = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      expect(useCase.send).toBeDefined();
      expect(typeof useCase.send).toBe("function");
    });

    it("should conditionally return checkHealth method", () => {
      const useCaseWithHealth = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
      });

      const useCaseWithoutHealth = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: { send: vi.fn() },
      });

      expect(useCaseWithHealth.checkHealth).toBeDefined();
      expect(useCaseWithoutHealth.checkHealth).toBeUndefined();
    });
  });
});
