import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createLoggerAdapter } from "./index.js";
import { EnvironmentType } from "../../../../shared/enums/EnvironmentType.js";
import { EventType } from "../../../../shared/enums/EventType.js";
import { LogLevel } from "../../../../shared/enums/LogLevel.js";
import { TriggerType } from "../../../../shared/enums/TriggerType.js";
import { RawLog } from "../../../../application/types/RawLog.js";

const mockWriteLog = vi.fn();

const mockLogger = {
  writeLog: mockWriteLog,
};

describe("createLoggerAdapter", () => {
  let service: ReturnType<typeof createLoggerAdapter>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Сохраняем оригинальные env переменные
    originalEnv = { ...process.env };

    service = createLoggerAdapter(mockLogger, {
      measurement: "isplanar_notification_logs",
      currentService: "isplanar_notification",
      environment: EnvironmentType.Development, // передаем environment из конфига
    });
    mockWriteLog.mockClear();
  });

  afterEach(() => {
    // Восстанавливаем оригинальные env переменные
    process.env = originalEnv;
  });

  it("should format log with correct tags and fields", async () => {
    const rawLog: RawLog = {
      level: LogLevel.Info,
      eventType: EventType.NotificationSuccess,
      spanId: "span123",
      message: "Test message",
      payload: { test: "data" },
    };

    await service.writeLog(rawLog);

    expect(mockWriteLog).toHaveBeenCalled();

    const logArg = mockWriteLog.mock.calls[0][0];

    expect(logArg).toMatchObject({
      measurement: "isplanar_notification_logs",
      tags: {
        level: "INFO",
        currentService: "isplanar_notification", // из конфига, а не из env
        trigger: TriggerType.Api, // жестко закодировано в адаптере
        environment: EnvironmentType.Development, // из конфига
        eventType: "notification_success",
        host: expect.any(String),
        spanId: "span123",
      },
      fields: {
        id: expect.any(String),
        message: "Test message",
        durationMs: 0,
        payload: JSON.stringify({ test: "data" }),
      },
    });
  });

  it("should handle errors in logs correctly", async () => {
    const error = new Error("Test error");
    const rawLog: RawLog = {
      level: LogLevel.Error,
      eventType: EventType.NotificationError,
      spanId: "span456",
      message: "Error message",
      error,
    };

    // Создаем сервис с другим environment
    const productionService = createLoggerAdapter(mockLogger, {
      measurement: "isplanar_notification_logs",
      currentService: "isplanar_notification",
      environment: EnvironmentType.Production,
    });

    await productionService.writeLog(rawLog);

    expect(mockWriteLog).toHaveBeenCalled();

    const logArg = mockWriteLog.mock.calls[0][0];

    expect(logArg).toMatchObject({
      tags: {
        level: "ERROR",
        currentService: "isplanar_notification",
        trigger: TriggerType.Api, // всегда Api
        environment: EnvironmentType.Production, // из конфига
        eventType: "notification_error",
        host: expect.any(String),
        spanId: "span456",
      },
      fields: {
        id: expect.any(String),
        message: "Error message",
        durationMs: 0,
        error: expect.stringContaining("Test error"),
      },
    });
  });

  it("should use different environment based on config", async () => {
    const stagingService = createLoggerAdapter(mockLogger, {
      measurement: "test_logs",
      currentService: "test_service",
      environment: EnvironmentType.Staging,
    });

    const rawLog: RawLog = {
      level: LogLevel.Warning,
      eventType: EventType.NotificationWarning,
      spanId: "span789",
      message: "Test environment",
    };

    await stagingService.writeLog(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.tags.environment).toBe(EnvironmentType.Staging);
    expect(logArg.tags.currentService).toBe("test_service");
  });

  it("should log an error if writing the log fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    mockWriteLog.mockRejectedValueOnce(new Error("Logging failed"));

    const rawLog: RawLog = {
      level: LogLevel.Debug,
      eventType: EventType.NotificationWarning,
      spanId: "span999",
      message: "Fail to log",
    };

    await service.writeLog(rawLog);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Не удалось записать лог в систему:",
      {
        originalLog: rawLog,
        loggingError: expect.any(Error),
      },
    );

    consoleErrorSpy.mockRestore();
  });
});
