import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSendNotificationUseCase } from "./createSendNotificationUseCase";
import { Notification } from "../../../domain/types/Notification.js";
import { Buffer } from "../../ports/Buffer.js";
import { LoggerAdapter } from "../../ports/LoggerAdapter.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { EventType } from "../../../shared/enums/EventType.js";
import {
  NotificationDeliveryService,
  SendResult,
} from "../../services/createNotificationDeliveryService/index.js";

const mockNotification = (message: string, isUrgent = false): Notification => ({
  recipients: [{ type: "email", value: "user@com" }],
  message,
  isUrgent,
});

const mockBuffer = (): Buffer<Notification> => ({
  append: vi.fn(),
  takeAll: vi.fn(),
});

const mockLoggerAdapter = (): LoggerAdapter => ({
  writeLog: vi.fn(),
});

const mockDeliveryService = (): NotificationDeliveryService => ({
  send: vi.fn(),
  checkHealth: vi.fn(),
});

describe("createSendNotificationUseCase", () => {
  let buffer: Buffer<Notification>;
  let loggerAdapter: LoggerAdapter;
  let deliveryService: NotificationDeliveryService;

  beforeEach(() => {
    buffer = mockBuffer();
    loggerAdapter = mockLoggerAdapter();
    deliveryService = mockDeliveryService();

    vi.clearAllMocks();
  });

  describe("send", () => {
    it("should do nothing when notifications array is empty", async () => {
      const { send } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await send([]);

      expect(buffer.append).not.toHaveBeenCalled();
      expect(deliveryService.send).not.toHaveBeenCalled();
      expect(loggerAdapter.writeLog).not.toHaveBeenCalled();
    });

    it("should buffer non-urgent notifications and log success", async () => {
      const notif1 = mockNotification("Non-urgent 1", false);
      const notif2 = mockNotification("Non-urgent 2", false);
      const notifications = [notif1, notif2];

      const { send } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await send(notifications);

      expect(buffer.append).toHaveBeenCalledWith(notifications);
      expect(loggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Debug,
        message: "2 несрочных уведомлений добавлено в буфер",
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationUseCase",
        payload: notifications,
      });
      expect(deliveryService.send).not.toHaveBeenCalled();
    });

    it("should send urgent notifications immediately and log success", async () => {
      const notif1 = mockNotification("Urgent 1", true);
      const notif2 = mockNotification("Urgent 2", true);
      const results: SendResult[] = [
        { success: true, notification: notif1 },
        { success: true, notification: notif2 },
      ];

      deliveryService.send = vi.fn().mockResolvedValue(results);

      const { send } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await send([notif1, notif2]);

      expect(deliveryService.send).toHaveBeenCalledWith([notif1, notif2]);
      expect(loggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: "Уведомление успешно отправлено",
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationUseCase",
        payload: results,
      });
      expect(buffer.append).not.toHaveBeenCalled();
    });

    it("should handle mixed urgent and non-urgent notifications correctly", async () => {
      const urgent = mockNotification("Urgent", true);
      const nonUrgent = mockNotification("Non-urgent", false);
      const notifications = [urgent, nonUrgent];

      const sendResults: SendResult[] = [
        { success: true, notification: urgent },
      ];

      deliveryService.send = vi.fn().mockResolvedValue(sendResults);

      const { send } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await send(notifications);

      expect(buffer.append).toHaveBeenCalledWith([nonUrgent]);
      expect(loggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Debug,
        message: "1 несрочных уведомлений добавлено в буфер",
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationUseCase",
        payload: [nonUrgent],
      });

      expect(deliveryService.send).toHaveBeenCalledWith([urgent]);
      expect(loggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: "Уведомление успешно отправлено",
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationUseCase",
        payload: sendResults,
      });
    });

    it("should log error if buffer.append throws", async () => {
      const nonUrgent = mockNotification("Non-urgent", false);
      const error = new Error("Buffer failed");

      buffer.append = vi.fn().mockImplementation(() => {
        throw error;
      });

      const { send } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await send(nonUrgent);

      expect(loggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Не удалось добавить уведомления в буфер",
        eventType: EventType.NotificationError,
        spanId: "createSendNotificationUseCase",
        error,
        payload: [nonUrgent],
      });
    });

    it("should log error if urgent notification delivery fails", async () => {
      const urgent = mockNotification("Urgent", true);
      const error = new Error("Send failed");
      const results: SendResult[] = [
        { success: false, notification: urgent, error },
      ];

      deliveryService.send = vi.fn().mockResolvedValue(results);

      const { send } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await send(urgent);

      expect(loggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Не удалось отправить уведомление",
        eventType: EventType.NotificationError,
        spanId: "createSendNotificationUseCase",
        payload: results,
      });
    });

    it("should handle single notification object", async () => {
      const notif = mockNotification("Single", true);
      const results: SendResult[] = [{ success: true, notification: notif }];

      deliveryService.send = vi.fn().mockResolvedValue(results);

      const { send } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await send(notif);

      expect(deliveryService.send).toHaveBeenCalledWith([notif]);
    });

    it("should do nothing if there are no urgent notifications", async () => {
      const nonUrgent = mockNotification("Non-urgent", false);

      const { send } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await send(nonUrgent);

      expect(buffer.append).toHaveBeenCalledWith([nonUrgent]);
      expect(deliveryService.send).not.toHaveBeenCalled();
      expect(loggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Debug,
        message: "1 несрочных уведомлений добавлено в буфер",
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationUseCase",
        payload: [nonUrgent],
      });
    });

    it("should do nothing if there are no non-urgent notifications", async () => {
      const urgent = mockNotification("Urgent", true);
      const results: SendResult[] = [{ success: true, notification: urgent }];

      deliveryService.send = vi.fn().mockResolvedValue(results);

      const { send } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await send(urgent);

      expect(buffer.append).not.toHaveBeenCalled();
      expect(deliveryService.send).toHaveBeenCalledWith([urgent]);
    });
  });

  describe("checkHealth", () => {
    it("should not expose checkHealth if delivery service does not support it", () => {
      const deliveryServiceWithoutHealth = {
        send: vi.fn(),
      } as unknown as NotificationDeliveryService;

      const useCase = createSendNotificationUseCase(
        buffer,
        deliveryServiceWithoutHealth,
        loggerAdapter,
      );

      expect(useCase.checkHealth).toBeUndefined();
    });

    it("should call deliveryService.checkHealth if available", async () => {
      const { checkHealth } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await checkHealth?.();

      expect(deliveryService.checkHealth).toHaveBeenCalled();
    });

    it("should propagate error from deliveryService.checkHealth", async () => {
      const error = new Error("Health check failed");
      deliveryService.checkHealth = vi.fn().mockRejectedValue(error);

      const { checkHealth } = createSendNotificationUseCase(
        buffer,
        deliveryService,
        loggerAdapter,
      );

      await expect(checkHealth?.()).rejects.toThrow(error);
    });
  });
});
