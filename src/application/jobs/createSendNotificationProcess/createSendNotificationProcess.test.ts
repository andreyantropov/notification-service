import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { Notification } from "../../../domain/types/Notification.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { Buffer } from "../../ports/Buffer.js";
import { LoggerAdapter } from "../../ports/LoggerAdapter.js";
import { createSendNotificationProcess } from "./createSendNotificationProcess.js";
import { SendNotificationProcessConfig } from "./interfaces/SendNotificationProcessConfig.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";

const mockNotification: Notification = {
  recipients: [{ type: "email", value: "test@example.com" }],
  message: "Test notification",
  isUrgent: false,
};

// Создаём моки с асинхронным интерфейсом
const mockBuffer = {
  append: vi.fn(),
  takeAll: vi.fn(),
} satisfies Buffer<Notification>;

const mockLoggerAdapter = {
  writeLog: vi.fn(),
} satisfies LoggerAdapter;

const mockNotificationDeliveryService = {
  send: vi.fn(),
} satisfies NotificationDeliveryService;

describe("createSendNotificationProcess", () => {
  let process: ReturnType<typeof createSendNotificationProcess>;
  let setIntervalSpy: ReturnType<typeof vi.spyOn>;
  let clearIntervalSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    setIntervalSpy = vi.spyOn(global, "setInterval") as unknown as ReturnType<
      typeof vi.spyOn
    >;
    clearIntervalSpy = vi.spyOn(global, "clearInterval");

    process = createSendNotificationProcess(
      mockBuffer,
      mockNotificationDeliveryService,
      mockLoggerAdapter,
    );
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
      mockBuffer,
      mockNotificationDeliveryService,
      mockLoggerAdapter,
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
    process.stop();
    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it("should not run if already processing", async () => {
    mockBuffer.takeAll.mockResolvedValue([mockNotification]);

    mockNotificationDeliveryService.send.mockReturnValue(new Promise(() => {}));

    process.start();

    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockBuffer.takeAll).toHaveBeenCalled();
    });

    vi.runOnlyPendingTimers();

    expect(mockNotificationDeliveryService.send).toHaveBeenCalledTimes(1);
  });

  it("should take all notifications from buffer and send them", async () => {
    mockBuffer.takeAll.mockResolvedValue([mockNotification]);
    mockNotificationDeliveryService.send.mockResolvedValue([
      { success: true, notification: mockNotification },
    ]);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockBuffer.takeAll).toHaveBeenCalled();
      expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith([
        mockNotification,
      ]);
    });
  });

  it("should log success when all notifications are sent successfully", async () => {
    const result = [{ success: true, notification: mockNotification }];
    mockBuffer.takeAll.mockResolvedValue([mockNotification]);
    mockNotificationDeliveryService.send.mockResolvedValue(result);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockLoggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Info,
        message: "Уведомление успешно отправлено",
        eventType: EventType.NotificationSuccess,
        spanId: "createSendNotificationProcess",
        payload: result,
      });
    });
  });

  it("should log error when some notifications fail", async () => {
    const result = [
      { success: true, notification: mockNotification },
      { success: false, notification: mockNotification, error: "Failed" },
    ];
    mockBuffer.takeAll.mockResolvedValue([mockNotification, mockNotification]);
    mockNotificationDeliveryService.send.mockResolvedValue(result);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockLoggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Не удалось отправить уведомление",
        eventType: EventType.NotificationError,
        spanId: "createSendNotificationProcess",
        payload: result,
      });
    });
  });

  it("should log error if delivery service throws an exception", async () => {
    const error = new Error("Network error");
    mockBuffer.takeAll.mockResolvedValue([mockNotification]);
    mockNotificationDeliveryService.send.mockRejectedValue(error);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockLoggerAdapter.writeLog).toHaveBeenCalledWith({
        level: LogLevel.Error,
        message: "Не удалось отправить уведомление",
        eventType: EventType.NotificationError,
        spanId: "createSendNotificationProcess",
        error,
      });
    });
  });

  it("should not throw if buffer is empty", async () => {
    mockBuffer.takeAll.mockResolvedValue([]); // ← Promise, а не значение
    process.start();

    vi.runOnlyPendingTimers();
    await Promise.resolve(); // Даем event loop завершить асинхронные операции

    expect(mockNotificationDeliveryService.send).not.toHaveBeenCalled();
  });

  it("should reset isProcessing flag after success", async () => {
    mockBuffer.takeAll
      .mockResolvedValueOnce([mockNotification])
      .mockResolvedValueOnce([mockNotification]);

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

    mockBuffer.takeAll
      .mockResolvedValueOnce([mockNotification])
      .mockResolvedValueOnce([mockNotification]);

    mockNotificationDeliveryService.send
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce([
        { success: true, notification: mockNotification },
      ]);

    process.start();

    vi.runOnlyPendingTimers();
    await vi.waitFor(() => {
      expect(mockLoggerAdapter.writeLog).toHaveBeenCalledWith(
        expect.objectContaining({
          level: LogLevel.Error,
          eventType: EventType.NotificationError,
        }),
      );
    });

    vi.runOnlyPendingTimers();
    await vi.waitFor(() => {
      expect(mockNotificationDeliveryService.send).toHaveBeenCalledTimes(2);
    });
  });
});
