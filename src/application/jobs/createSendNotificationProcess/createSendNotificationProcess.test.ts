import {
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
  vi,
  MockInstance,
} from "vitest";

import { createSendNotificationProcess } from "./createSendNotificationProcess.js";
import { SendNotificationProcessConfig } from "./interfaces/SendNotificationProcessConfig.js";
import { Notification } from "../../../domain/types/Notification.js";
import { Buffer } from "../../ports/Buffer.js";
import { NotificationDeliveryService } from "../../services/createNotificationDeliveryService/index.js";

const mockNotification1: Notification = {
  recipients: [{ type: "email", value: "test1@example.com" }],
  message: "Test notification 1",
  isUrgent: false,
};

const mockNotification2: Notification = {
  recipients: [{ type: "email", value: "test2@example.com" }],
  message: "Test notification 2",
  isUrgent: false,
};

const mockBuffer = {
  append: vi.fn(),
  takeAll: vi.fn(),
} satisfies Buffer<Notification>;

const mockNotificationDeliveryService = {
  send: vi.fn(),
} satisfies NotificationDeliveryService;

describe("createSendNotificationProcess", () => {
  let process: ReturnType<typeof createSendNotificationProcess>;
  let setIntervalSpy: MockInstance<typeof setInterval>;
  let clearIntervalSpy: MockInstance<typeof clearInterval>;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    setIntervalSpy = vi.spyOn(global, "setInterval");
    clearIntervalSpy = vi.spyOn(global, "clearInterval");

    process = createSendNotificationProcess({
      buffer: mockBuffer,
      notificationDeliveryService: mockNotificationDeliveryService,
    });
  });

  afterEach(async () => {
    vi.useRealTimers();
    if (process) {
      await process.shutdown();
    }
    vi.restoreAllMocks();
  });

  it("should start the interval with default interval (60s)", () => {
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

  it("should stop the interval when stop is called", async () => {
    process.start();
    const timerId = setIntervalSpy.mock.results[0].value;
    await process.shutdown();
    expect(clearIntervalSpy).toHaveBeenCalledWith(timerId);
  });

  it("should not run if already processing", async () => {
    let resolveSend: (value: unknown) => void;
    const sendPromise = new Promise((resolve) => {
      resolveSend = resolve;
    });

    mockBuffer.takeAll.mockResolvedValue([mockNotification1]);
    mockNotificationDeliveryService.send.mockImplementation(() => sendPromise);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockBuffer.takeAll).toHaveBeenCalledTimes(1);
    });

    vi.runOnlyPendingTimers();
    await Promise.resolve();

    expect(mockBuffer.takeAll).toHaveBeenCalledTimes(1);
    expect(mockNotificationDeliveryService.send).toHaveBeenCalledTimes(1);

    resolveSend!([{ success: true, notification: mockNotification1 }]);
  });

  it("should take all notifications and send them in a single batch", async () => {
    const notifications = [mockNotification1, mockNotification2];
    mockBuffer.takeAll.mockResolvedValue(notifications);
    mockNotificationDeliveryService.send.mockResolvedValue([
      { success: true, notification: mockNotification1 },
      { success: true, notification: mockNotification2 },
    ]);

    process.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockBuffer.takeAll).toHaveBeenCalled();
      expect(mockNotificationDeliveryService.send).toHaveBeenCalledTimes(1);
      expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith(
        notifications,
      );
    });
  });

  it("should not call send if buffer is empty", async () => {
    mockBuffer.takeAll.mockResolvedValue([]);
    process.start();

    vi.runOnlyPendingTimers();
    await Promise.resolve();

    expect(mockNotificationDeliveryService.send).not.toHaveBeenCalled();
  });

  it("should reset isProcessing flag after success", async () => {
    mockBuffer.takeAll
      .mockResolvedValueOnce([mockNotification1])
      .mockResolvedValueOnce([mockNotification2]);

    mockNotificationDeliveryService.send
      .mockResolvedValueOnce([
        { success: true, notification: mockNotification1 },
      ])
      .mockResolvedValueOnce([
        { success: true, notification: mockNotification2 },
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
      .mockResolvedValueOnce([mockNotification1])
      .mockResolvedValueOnce([mockNotification2]);

    mockNotificationDeliveryService.send
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce([
        { success: true, notification: mockNotification2 },
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

  it("should call onError if buffer.takeAll throws", async () => {
    const mockOnError = vi.fn();
    const error = new Error("Buffer read failed");
    mockBuffer.takeAll.mockRejectedValue(error);

    const processWithErrorHandler = createSendNotificationProcess(
      {
        buffer: mockBuffer,
        notificationDeliveryService: mockNotificationDeliveryService,
      },
      { onError: mockOnError },
    );

    processWithErrorHandler.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      const err = mockOnError.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe(
        "При обработке отложенных уведомлений произошла ошибка",
      );
      expect(err.cause).toBe(error);
    });

    await processWithErrorHandler.shutdown();
  });

  it("should call onError if notificationDeliveryService.send throws", async () => {
    const mockOnError = vi.fn();
    const error = new Error("Network error");
    mockBuffer.takeAll.mockResolvedValue([mockNotification1]);
    mockNotificationDeliveryService.send.mockRejectedValue(error);

    const processWithErrorHandler = createSendNotificationProcess(
      {
        buffer: mockBuffer,
        notificationDeliveryService: mockNotificationDeliveryService,
      },
      { onError: mockOnError },
    );

    processWithErrorHandler.start();
    vi.runOnlyPendingTimers();

    await vi.waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      const err = mockOnError.mock.calls[0][0];
      expect(err.message).toBe(
        "При обработке отложенных уведомлений произошла ошибка",
      );
      expect(err.cause).toBe(error);
    });

    await processWithErrorHandler.shutdown();
  });

  it("should process remaining notifications during shutdown", async () => {
    const notifications = [mockNotification1, mockNotification2];
    mockBuffer.takeAll.mockResolvedValue(notifications);
    mockNotificationDeliveryService.send.mockResolvedValue([
      { success: true, notification: mockNotification1 },
      { success: true, notification: mockNotification2 },
    ]);

    process.start();

    await process.shutdown();

    expect(mockBuffer.takeAll).toHaveBeenCalledTimes(1);
    expect(mockNotificationDeliveryService.send).toHaveBeenCalledWith(
      notifications,
    );
  });

  it("should not start new processing during shutdown", async () => {
    mockBuffer.takeAll.mockResolvedValue([]);

    process.start();
    await process.shutdown();

    const newProcess = createSendNotificationProcess({
      buffer: mockBuffer,
      notificationDeliveryService: mockNotificationDeliveryService,
    });

    newProcess.start();
    expect(setIntervalSpy).toHaveBeenCalledTimes(2);
    await newProcess.shutdown();
  });

  it("should handle empty buffer during shutdown", async () => {
    mockBuffer.takeAll.mockResolvedValue([]);

    process.start();
    await process.shutdown();

    expect(mockBuffer.takeAll).toHaveBeenCalledTimes(1);
    expect(mockNotificationDeliveryService.send).not.toHaveBeenCalled();
  });
});
