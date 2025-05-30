import { createNotificationLoggerService, EventType } from "./index";
import { EnvironmentType } from "../../../shared/enums/EnvironmentType";
import { TriggerType } from "../../../shared/enums/TriggerType";
import { RawLog } from "./interfaces/RawLog";
import { NotificationLoggerServiceConfig } from "./interfaces/NotificationLoggerServiceConfig";
import { LogLevel } from "../../../shared/enums/LogLevel";

const mockWriteLog = jest.fn();

const mockLogger = {
  writeLog: mockWriteLog,
};

describe("createNotificationLoggerService", () => {
  let service: { writeLog: (log: RawLog) => Promise<void> };

  beforeEach(() => {
    const config: NotificationLoggerServiceConfig = {
      logger: mockLogger,
    };
    service = createNotificationLoggerService(config);
    mockWriteLog.mockClear();
  });

  it("should format log with correct tags and fields", async () => {
    const rawLog: RawLog = {
      level: LogLevel.Info,
      eventType: EventType.SendNotificationSuccess,
      spanId: "span123",
      message: "Test message",
      payload: { test: "data" },
    };

    process.env.CURRENT_SERVICE = "current-service";
    process.env.CALLER_SERVICE = "caller-service";
    process.env.TRIGGER_TYPE = TriggerType.Cron;
    process.env.NODE_ENV = "development";

    await service.writeLog(rawLog);

    expect(mockWriteLog).toHaveBeenCalled();

    const logArg = mockWriteLog.mock.calls[0][0];

    expect(logArg).toMatchObject({
      measurement: "isplanar_notification_logs",
      tags: {
        level: "INFO",
        currentService: "current-service",
        callerService: "caller-service",
        trigger: TriggerType.Cron,
        environment: EnvironmentType.Development,
        eventType: "send_notification_success",
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
      eventType: EventType.SendNotificationError,
      spanId: "span456",
      message: "Error message",
      error,
    };

    process.env.CURRENT_SERVICE = "service-a";
    process.env.CALLER_SERVICE = "service-b";
    process.env.TRIGGER_TYPE = TriggerType.Manual;
    process.env.NODE_ENV = "production";

    await service.writeLog(rawLog);

    expect(mockWriteLog).toHaveBeenCalled();

    const logArg = mockWriteLog.mock.calls[0][0];

    expect(logArg).toMatchObject({
      tags: {
        level: "ERROR",
        currentService: "service-a",
        callerService: "service-b",
        trigger: TriggerType.Manual,
        environment: EnvironmentType.Production,
        eventType: "send_notification_error",
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

  it("should use default values when env variables are not set", async () => {
    delete process.env.CURRENT_SERVICE;
    delete process.env.CALLER_SERVICE;
    delete process.env.TRIGGER_TYPE;
    delete process.env.NODE_ENV;

    const rawLog: RawLog = {
      level: LogLevel.Warning,
      eventType: EventType.SendSmtpNotification,
      spanId: "span789",
      message: "Default env values",
    };

    await service.writeLog(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];

    expect(logArg.tags.currentService).toBe("unknown-service");
    expect(logArg.tags.callerService).toBe("unknown-service");
    expect(logArg.tags.trigger).toBe(TriggerType.Manual);
    expect(logArg.tags.environment).toBe(EnvironmentType.Production);
  });

  it("should log an error if writing the log fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    mockWriteLog.mockRejectedValueOnce(new Error("Logging failed"));

    const rawLog: RawLog = {
      level: LogLevel.Debug,
      eventType: EventType.SendBitrixNotification,
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
