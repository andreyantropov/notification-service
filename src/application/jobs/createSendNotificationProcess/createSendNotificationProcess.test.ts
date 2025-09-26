import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

import { createSendNotificationProcess } from "./createSendNotificationProcess.js";
import { SendNotificationProcessConfig } from "./interfaces/SendNotificationProcessConfig.js";
import { Notification } from "../../../domain/types/Notification.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { Buffer } from "../../ports/Buffer.js";
import { LoggerAdapter } from "../../ports/LoggerAdapter.js";
import { TracingContextManager } from "../../ports/TracingContextManager.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";

const mockNotification: Notification = {
  recipients: [{ type: "email", value: "test@example.com" }],
  message: "Test notification",
  isUrgent: false,
};

const mockOtelContext = { traceId: "trace-1", spanId: "span-1" };

const mockBuffer = {
  append: vi.fn(),
  takeAll: vi.fn(),
} satisfies Buffer<{ notification: Notification; otelContext: unknown }>;

const mockLoggerAdapter = {
  debug: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
  critical: vi.fn(),
} satisfies LoggerAdapter;

const mockNotificationDeliveryService = {
  send: vi.fn(),
} satisfies NotificationDeliveryService;

const mockTracingContextManager = {
  active: vi.fn(),
  with: vi.fn((ctx, fn) => fn()),
  getTraceContext: vi.fn(),
  startActiveSpan: vi.fn((name, options, fn) => fn()),
} satisfies TracingContextManager;

describe("createSendNotificationProcess", () => {
  let process: ReturnType<typeof createSendNotificationProcess>;
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    setIntervalSpy = vi.spyOn(global, "setInterval") as ReturnType<
      typeof vi.spyOn
    >;
    clearIntervalSpy = vi.spyOn(global, "clearInterval");

    process = createSendNotificationProcess({
      buffer: mockBuffer,
      notificationDeliveryService: mockNotificationDeliveryService,
      tracingContextManager: mockTracingContextManager,
      loggerAdapter: mockLoggerAdapter,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    process.stop();
    vi.restoreAllMocks();
  });

  it("should start the interval with default interval", () => {
    process.start();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 60_000);
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it("should use custom interval if provided", () => {
    const config: SendNotificationProcessConfig = { interval: 5000 };
    const customProcess = createSendNotificationProcess(
      {
        buffer: mockBuffer,
        notificationDeliveryService: mockNotificationDeliveryService,
        tracingContextManager: mockTracingContextManager,
        loggerAdapter: mockLoggerAdapter,
      },
      config,
    );

    customProcess.start();
    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
  });

  it("should not start multiple intervals if start is called twice", () => {
    process.start();
    process.start();
    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it("should stop the interval when stop is called", () => {
    process.start();
    const timerId = setIntervalSpy.mock.results[0].value;
    process.stop();
    expect(clearIntervalSpy).toHaveBeenCalledWith(timerId);
  });

  it("should not run if already processing", async () => {
    mockBuffer.takeAll.mockResolvedValue([
      { notification: mockNotification, otelContext: mockOtelContext },
    ]);

    mockNotificationDeliveryService.send.mockReturnValue(new Promise(() => {}));

    process.start();

    vi.runOnlyPendingTimers();
    await vi.waitFor(() => {
      expect(mockBuffer.takeAll).toHaveBeenCalledTimes(1);
    });

    vi.runOnlyPendingTimers();

    await Promise.resolve();

    expect(mockBuffer.takeAll).toHaveBeenCalledTimes(1);
    expect(mockNotificationDeliveryService.send).toHaveBeenCalledTimes(1);
  });

  it("should take all notifications from buffer and send them", async () => {
    const bufferedNotification = {
      notification: mockNotification,
      otelContext: mockOtelContext,
    };

    mockBuffer.takeAll.mockResolvedValue([bufferedNotification]);
    mockNotificationDeliveryService.send.mockResolvedValue([
      { success: true, notification: mockNotification },
    ]);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockBuffer.takeAll).toHaveBeenCalled();
      expect(mockTracingContextManager.with).toHaveBeenCalledWith(
        mockOtelContext,
        expect.any(Function),
      );
      expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith([
        mockNotification,
      ]);
    });
  });

  it("should log success when all notifications are sent successfully", async () => {
    const result = [{ success: true, notification: mockNotification }];
    const bufferedNotification = {
      notification: mockNotification,
      otelContext: mockOtelContext,
    };

    mockBuffer.takeAll.mockResolvedValue([bufferedNotification]);
    mockNotificationDeliveryService.send.mockResolvedValue(result);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockLoggerAdapter.info).toHaveBeenCalledWith({
        message: "Уведомление успешно отправлено",
        eventType: EventType.MessagePublish,
        details: result,
      });
    });
  });

  it("should log warning when notifications have warnings", async () => {
    const result = [
      {
        success: true,
        notification: mockNotification,
        warnings: ["Some warning"],
      },
    ];
    const bufferedNotification = {
      notification: mockNotification,
      otelContext: mockOtelContext,
    };

    mockBuffer.takeAll.mockResolvedValue([bufferedNotification]);
    mockNotificationDeliveryService.send.mockResolvedValue(result);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockLoggerAdapter.warning).toHaveBeenCalledWith({
        message: "Уведомление отправлено, но в ходе работы возникли ошибки",
        eventType: EventType.MessagePublish,
        details: result,
      });
    });
  });

  it("should log error when some notifications fail", async () => {
    const result = [
      { success: true, notification: mockNotification },
      { success: false, notification: mockNotification, error: "Failed" },
    ];
    const bufferedNotification = {
      notification: mockNotification,
      otelContext: mockOtelContext,
    };

    mockBuffer.takeAll.mockResolvedValue([
      bufferedNotification,
      bufferedNotification,
    ]);
    mockNotificationDeliveryService.send.mockResolvedValue(result);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockLoggerAdapter.error).toHaveBeenCalledWith({
        message: "Не удалось отправить одно или несколько уведомлений",
        eventType: EventType.MessagePublish,
        details: result,
      });
    });
  });

  it("should log error if delivery service throws an exception", async () => {
    const error = new Error("Network error");
    const bufferedNotification = {
      notification: mockNotification,
      otelContext: mockOtelContext,
    };

    mockBuffer.takeAll.mockResolvedValue([bufferedNotification]);
    mockNotificationDeliveryService.send.mockRejectedValue(error);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockLoggerAdapter.error).toHaveBeenCalledWith({
        message: "Не удалось отправить уведомления",
        eventType: EventType.MessagePublish,
        details: [mockNotification],
        error,
      });
    });
  });

  it("should not throw if buffer is empty", async () => {
    mockBuffer.takeAll.mockResolvedValue([]);
    process.start();

    vi.runOnlyPendingTimers();
    await Promise.resolve();

    expect(mockNotificationDeliveryService.send).not.toHaveBeenCalled();
    expect(mockTracingContextManager.with).not.toHaveBeenCalled();
  });

  it("should reset isProcessing flag after success", async () => {
    const bufferedNotification = {
      notification: mockNotification,
      otelContext: mockOtelContext,
    };

    mockBuffer.takeAll
      .mockResolvedValueOnce([bufferedNotification])
      .mockResolvedValueOnce([bufferedNotification]);

    mockNotificationDeliveryService.send
      .mockResolvedValueOnce([
        { success: true, notification: mockNotification },
      ])
      .mockResolvedValueOnce([
        { success: true, notification: mockNotification },
      ]);

    process.start();

    vi.runOnlyPendingTimers();
    await vi.waitFor(() => {
      expect(mockNotificationDeliveryService.send).toHaveBeenCalledTimes(1);
    });

    vi.runOnlyPendingTimers();
    await vi.waitFor(() => {
      expect(mockNotificationDeliveryService.send).toHaveBeenCalledTimes(2);
    });
  });

  it("should reset isProcessing flag after error", async () => {
    const error = new Error("Delivery failed");
    const bufferedNotification = {
      notification: mockNotification,
      otelContext: mockOtelContext,
    };

    mockBuffer.takeAll
      .mockResolvedValueOnce([bufferedNotification])
      .mockResolvedValueOnce([bufferedNotification]);

    mockNotificationDeliveryService.send
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce([
        { success: true, notification: mockNotification },
      ]);

    process.start();

    vi.runOnlyPendingTimers();
    await vi.waitFor(() => {
      expect(mockLoggerAdapter.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Не удалось отправить уведомления",
          eventType: EventType.MessagePublish,
        }),
      );
    });

    vi.runOnlyPendingTimers();
    await vi.waitFor(() => {
      expect(mockNotificationDeliveryService.send).toHaveBeenCalledTimes(2);
    });
  });

  it("should log error when buffer.takeAll fails", async () => {
    const error = new Error("Buffer error");
    mockBuffer.takeAll.mockRejectedValue(error);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockLoggerAdapter.error).toHaveBeenCalledWith({
        message: "Не удалось обработать буфер уведомлений",
        eventType: EventType.MessagePublish,
        error,
      });
    });
  });

  it("should process each notification individually with tracing context", async () => {
    const bufferedNotification1 = {
      notification: { ...mockNotification, message: "First" },
      otelContext: { traceId: "trace-1", spanId: "span-1" },
    };

    const bufferedNotification2 = {
      notification: { ...mockNotification, message: "Second" },
      otelContext: { traceId: "trace-2", spanId: "span-2" },
    };

    mockBuffer.takeAll.mockResolvedValue([
      bufferedNotification1,
      bufferedNotification2,
    ]);
    mockNotificationDeliveryService.send.mockResolvedValue([
      { success: true, notification: bufferedNotification1.notification },
      { success: true, notification: bufferedNotification2.notification },
    ]);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockTracingContextManager.with).toHaveBeenCalledTimes(2);
      expect(mockTracingContextManager.with).toHaveBeenCalledWith(
        bufferedNotification1.otelContext,
        expect.any(Function),
      );
      expect(mockTracingContextManager.with).toHaveBeenCalledWith(
        bufferedNotification2.otelContext,
        expect.any(Function),
      );
    });
  });
});
