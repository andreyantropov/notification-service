import { describe, it, expect, vi, beforeEach } from "vitest";

import { createSendNotificationUseCase } from "./createSendNotificationUseCase.js";
import { Notification } from "../../../domain/types/Notification.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { Buffer } from "../../ports/Buffer.js";
import { LoggerAdapter } from "../../ports/LoggerAdapter.js";
import { TracingContextManager } from "../../ports/TracingContextManager.js";
import {
  NotificationDeliveryService,
  SendResult,
} from "../../services/createNotificationDeliveryService/index.js";
import { BufferedNotification } from "../../types/BufferedNotification.js";

const mockNotification = (message: string, isUrgent = false): Notification => ({
  recipients: [{ type: "email", value: "user@com" }],
  message,
  isUrgent,
});

const mockBuffer = (): Buffer<BufferedNotification> => ({
  append: vi.fn(),
  takeAll: vi.fn(),
});

const mockLoggerAdapter = (): LoggerAdapter => ({
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  critical: vi.fn(),
});

const mockDeliveryService = (): NotificationDeliveryService => ({
  send: vi.fn(),
  checkHealth: vi.fn(),
});

describe("createSendNotificationUseCase", () => {
  let buffer: Buffer<BufferedNotification>;
  let loggerAdapter: LoggerAdapter;
  let deliveryService: NotificationDeliveryService;
  let tracingContextManager: TracingContextManager;

  beforeEach(() => {
    buffer = mockBuffer();
    loggerAdapter = mockLoggerAdapter();
    deliveryService = mockDeliveryService();

    tracingContextManager = {
      active: vi.fn(),
      with: vi.fn((ctx, fn) => fn()),
      getTraceContext: vi.fn(),
      startActiveSpan: vi.fn((name, options, fn) => fn()),
    };

    vi.clearAllMocks();

    (tracingContextManager.active as ReturnType<typeof vi.fn>).mockReturnValue({
      traceId: "test-trace",
      spanId: "test-span",
    });
  });

  describe("send", () => {
    it("should do nothing when notifications array is empty", async () => {
      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send([]);

      expect(buffer.append).not.toHaveBeenCalled();
      expect(deliveryService.send).not.toHaveBeenCalled();
      expect(loggerAdapter.info).not.toHaveBeenCalled();
      expect(loggerAdapter.debug).not.toHaveBeenCalled();
    });

    it("should buffer non-urgent notifications and log success", async () => {
      const notif1 = mockNotification("Non-urgent 1", false);
      const notif2 = mockNotification("Non-urgent 2", false);
      const notifications = [notif1, notif2];

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send(notifications);

      const expectedBufferedNotifications: BufferedNotification[] = [
        {
          notification: notif1,
          otelContext: { traceId: "test-trace", spanId: "test-span" },
        },
        {
          notification: notif2,
          otelContext: { traceId: "test-trace", spanId: "test-span" },
        },
      ];

      expect(buffer.append).toHaveBeenCalledWith(expectedBufferedNotifications);
      expect(loggerAdapter.debug).toHaveBeenCalledWith({
        message: "2 несрочных уведомлений добавлено в буфер",
        eventType: EventType.CacheOperation,
        details: [notif1, notif2],
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

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send([notif1, notif2]);

      expect(deliveryService.send).toHaveBeenCalledWith([notif1, notif2]);
      expect(loggerAdapter.info).toHaveBeenCalledWith({
        message: "Уведомление успешно отправлено",
        eventType: EventType.MessagePublish,
        details: results,
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

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send(notifications);

      const expectedBufferedNotification: BufferedNotification[] = [
        {
          notification: nonUrgent,
          otelContext: { traceId: "test-trace", spanId: "test-span" },
        },
      ];

      expect(buffer.append).toHaveBeenCalledWith(expectedBufferedNotification);
      expect(deliveryService.send).toHaveBeenCalledWith([urgent]);

      expect(loggerAdapter.info).toHaveBeenCalledWith({
        message: "Уведомление успешно отправлено",
        eventType: EventType.MessagePublish,
        details: sendResults,
      });

      expect(loggerAdapter.debug).toHaveBeenCalledWith({
        message: "1 несрочных уведомлений добавлено в буфер",
        eventType: EventType.CacheOperation,
        details: [nonUrgent],
      });
    });

    it("should log error if buffer.append throws", async () => {
      const nonUrgent = mockNotification("Non-urgent", false);
      const error = new Error("Buffer failed");

      buffer.append = vi.fn().mockRejectedValue(error);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send([nonUrgent]);

      expect(loggerAdapter.error).toHaveBeenCalledWith({
        message: "Не удалось добавить уведомления в буфер",
        eventType: EventType.CacheOperation,
        details: [nonUrgent],
        error,
      });
    });

    it("should log error if urgent notification delivery fails", async () => {
      const urgent = mockNotification("Urgent", true);
      const error = new Error("Send failed");
      const results: SendResult[] = [
        { success: false, notification: urgent, error },
      ];

      deliveryService.send = vi.fn().mockResolvedValue(results);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send([urgent]);

      expect(loggerAdapter.error).toHaveBeenCalledWith({
        message: "Не удалось отправить одно или несколько уведомлений",
        eventType: EventType.MessagePublish,
        details: results,
      });
    });

    it("should log warning if urgent notification delivery has warnings", async () => {
      const urgent = mockNotification("Urgent", true);
      const results: SendResult[] = [
        {
          success: true,
          notification: urgent,
          warnings: [
            { message: "Slow delivery", recipient: urgent.recipients[0] },
          ],
        },
      ];

      deliveryService.send = vi.fn().mockResolvedValue(results);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send([urgent]);

      expect(loggerAdapter.warning).toHaveBeenCalledWith({
        message: "Уведомление отправлено, но в ходе работы возникли ошибки",
        eventType: EventType.MessagePublish,
        details: results,
      });
    });

    it("should handle single notification object", async () => {
      const notif = mockNotification("Single", true);
      const results: SendResult[] = [{ success: true, notification: notif }];

      deliveryService.send = vi.fn().mockResolvedValue(results);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send(notif);

      expect(deliveryService.send).toHaveBeenCalledWith([notif]);
    });

    it("should buffer non-urgent notifications and not send them", async () => {
      const nonUrgent = mockNotification("Non-urgent", false);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send([nonUrgent]);

      const expectedBufferedNotification: BufferedNotification[] = [
        {
          notification: nonUrgent,
          otelContext: { traceId: "test-trace", spanId: "test-span" },
        },
      ];

      expect(buffer.append).toHaveBeenCalledWith(expectedBufferedNotification);
      expect(deliveryService.send).not.toHaveBeenCalled();
      expect(loggerAdapter.debug).toHaveBeenCalledWith({
        message: "1 несрочных уведомлений добавлено в буфер",
        eventType: EventType.CacheOperation,
        details: [nonUrgent],
      });
    });

    it("should send urgent notifications and not buffer them", async () => {
      const urgent = mockNotification("Urgent", true);
      const results: SendResult[] = [{ success: true, notification: urgent }];

      deliveryService.send = vi.fn().mockResolvedValue(results);

      const { send } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
      });

      await send([urgent]);

      expect(buffer.append).not.toHaveBeenCalled();
      expect(deliveryService.send).toHaveBeenCalledWith([urgent]);
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
        tracingContextManager,
        loggerAdapter,
      });

      expect(useCase.checkHealth).toBeUndefined();
    });

    it("should call deliveryService.checkHealth if available", async () => {
      deliveryService.checkHealth = vi.fn().mockResolvedValue(undefined);

      const { checkHealth } = createSendNotificationUseCase({
        buffer,
        notificationDeliveryService: deliveryService,
        tracingContextManager,
        loggerAdapter,
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
        tracingContextManager,
        loggerAdapter,
      });

      await expect(checkHealth?.()).rejects.toThrow(error);
    });
  });
});
