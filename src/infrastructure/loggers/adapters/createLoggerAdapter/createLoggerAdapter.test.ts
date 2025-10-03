import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createLoggerAdapter } from "./index.js";
import { TracingContextManager } from "../../../../application/ports/TracingContextManager.js";
import { RawLog } from "../../../../application/types/RawLog.js";
import { EnvironmentType } from "../../../../shared/enums/EnvironmentType.js";
import { EventType } from "../../../../shared/enums/EventType.js";
import { TriggerType } from "../../../../shared/enums/TriggerType.js";
import { noop } from "../../../../shared/utils/noop/noop.js";

const mockWriteLog = vi.fn();

const mockLogger = {
  writeLog: mockWriteLog,
};

const mockTracingContextManager = {
  active: vi.fn(),
  with: vi.fn((ctx, fn) => fn()),
  getTraceContext: vi.fn(),
  startActiveSpan: vi.fn((name, options, fn) => fn()),
} satisfies TracingContextManager;

describe("createLoggerAdapter", () => {
  let service: ReturnType<typeof createLoggerAdapter>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();

    mockTracingContextManager.active.mockReturnValue({});
    mockTracingContextManager.getTraceContext.mockReturnValue({
      traceId: "test-trace-id",
      spanId: "test-span-id",
    });

    service = createLoggerAdapter(
      {
        logger: mockLogger,
        tracingContextManager: mockTracingContextManager,
      },
      {
        measurement: "isplanar_notification_logs",
        serviceName: "isplanar_notification",
        serviceVersion: "1.0.0",
        environment: EnvironmentType.Development,
      },
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should format log with correct tags and fields", async () => {
    const rawLog: RawLog = {
      eventType: EventType.MessagePublish,
      message: "Test message",
      details: { test: "data" },
    };

    await service.info(rawLog);

    expect(mockWriteLog).toHaveBeenCalled();

    const logArg = mockWriteLog.mock.calls[0][0];

    expect(logArg).toMatchObject({
      measurement: "isplanar_notification_logs",
      tags: {
        level: "INFO",
        serviceName: "isplanar_notification",
        serviceVersion: "1.0.0",
        trigger: TriggerType.Api,
        environment: EnvironmentType.Development,
        eventType: EventType.MessagePublish,
        host: expect.any(String),
      },
      fields: {
        id: expect.any(String),
        message: "Test message",
        durationMs: 0,
        traceId: "test-trace-id",
        spanId: "test-span-id",
        details: JSON.stringify({ test: "data" }),
      },
    });
  });

  it("should handle errors in logs correctly", async () => {
    const error = new Error("Test error");
    const rawLog: RawLog = {
      eventType: EventType.DependencyFailure,
      message: "Error message",
      error,
    };

    const productionService = createLoggerAdapter(
      {
        logger: mockLogger,
        tracingContextManager: mockTracingContextManager,
      },
      {
        measurement: "isplanar_notification_logs",
        serviceName: "isplanar_notification",
        serviceVersion: "1.0.0",
        environment: EnvironmentType.Production,
      },
    );

    await productionService.error(rawLog);

    expect(mockWriteLog).toHaveBeenCalled();

    const logArg = mockWriteLog.mock.calls[0][0];

    expect(logArg.tags.level).toBe("ERROR");
    expect(logArg.tags.environment).toBe(EnvironmentType.Production);
    expect(logArg.tags.eventType).toBe(EventType.DependencyFailure);
    expect(logArg.fields.message).toBe("Error message");
    expect(logArg.fields.error).toContain("Test error");
  });

  it("should use different environment based on config", async () => {
    const stagingService = createLoggerAdapter(
      {
        logger: mockLogger,
        tracingContextManager: mockTracingContextManager,
      },
      {
        measurement: "test_logs",
        serviceName: "test_service",
        serviceVersion: "2.0.0",
        environment: EnvironmentType.Staging,
      },
    );

    const rawLog: RawLog = {
      eventType: EventType.ExternalCall,
      message: "Test environment",
    };

    await stagingService.warning(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.tags.environment).toBe(EnvironmentType.Staging);
    expect(logArg.tags.serviceName).toBe("test_service");
    expect(logArg.tags.serviceVersion).toBe("2.0.0");
  });

  it("should log an error if writing the log fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(noop);

    mockWriteLog.mockRejectedValueOnce(new Error("Logging failed"));

    const rawLog: RawLog = {
      eventType: EventType.CircuitBreaker,
      message: "Fail to log",
    };

    await service.debug(rawLog);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Не удалось записать лог в систему:",
      {
        originalLog: rawLog,
        loggingError: expect.any(Error),
      },
    );

    consoleErrorSpy.mockRestore();
  });

  it("should call correct log level methods", async () => {
    const rawLog: RawLog = {
      eventType: EventType.Request,
      message: "Test message",
    };

    await service.debug(rawLog);
    expect(mockWriteLog.mock.calls[0][0].tags.level).toBe("DEBUG");

    await service.info(rawLog);
    expect(mockWriteLog.mock.calls[1][0].tags.level).toBe("INFO");

    await service.warning(rawLog);
    expect(mockWriteLog.mock.calls[2][0].tags.level).toBe("WARNING");

    await service.error(rawLog);
    expect(mockWriteLog.mock.calls[3][0].tags.level).toBe("ERROR");

    await service.critical(rawLog);
    expect(mockWriteLog.mock.calls[4][0].tags.level).toBe("CRITICAL");
  });

  it("should handle duration in logs", async () => {
    const rawLog: RawLog = {
      eventType: EventType.Request,
      message: "Test with duration",
      duration: 150,
    };

    await service.info(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.fields.durationMs).toBe(150);
  });

  it("should handle missing tracing context", async () => {
    mockTracingContextManager.getTraceContext.mockReturnValueOnce(null);

    const rawLog: RawLog = {
      eventType: EventType.Command,
      message: "Test without trace",
    };

    await service.info(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.fields.traceId).toBeUndefined();
    expect(logArg.fields.spanId).toBeUndefined();
  });

  it("should safely stringify circular objects", async () => {
    const circularObj: Record<string, unknown> = { test: "data" };
    circularObj.self = circularObj;

    const rawLog: RawLog = {
      eventType: EventType.Query,
      message: "Test circular",
      details: circularObj,
    };

    await service.info(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.fields.details).toBeUndefined();
  });

  it("should handle string details without double-stringifying", async () => {
    const rawLog: RawLog = {
      eventType: EventType.MessageConsume,
      message: "Test string details",
      details: "plain string",
    };

    await service.info(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.fields.details).toBe("plain string");
  });

  it("should handle different event types correctly", async () => {
    const eventTypes = [
      EventType.Bootstrap,
      EventType.Shutdown,
      EventType.HealthCheck,
      EventType.CronJob,
      EventType.CacheOperation,
      EventType.AuthAttempt,
      EventType.AccessDenied,
      EventType.ConfigReload,
      EventType.RetryAttempt,
    ];

    for (const eventType of eventTypes) {
      const rawLog: RawLog = {
        eventType,
        message: `Test for ${eventType}`,
      };

      await service.info(rawLog);
      const lastCall =
        mockWriteLog.mock.calls[mockWriteLog.mock.calls.length - 1][0];
      expect(lastCall.tags.eventType).toBe(eventType);
    }
  });

  it("should handle undefined details", async () => {
    const rawLog: RawLog = {
      eventType: EventType.Request,
      message: "Test undefined details",
    };

    await service.info(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.fields.details).toBeUndefined();
  });

  it("should handle null details", async () => {
    const rawLog: RawLog = {
      eventType: EventType.Request,
      message: "Test null details",
      details: null,
    };

    await service.info(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.fields.details).toBe("null");
  });

  it("should handle number details", async () => {
    const rawLog: RawLog = {
      eventType: EventType.Request,
      message: "Test number details",
      details: 42,
    };

    await service.info(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.fields.details).toBe("42");
  });

  it("should handle boolean details", async () => {
    const rawLog: RawLog = {
      eventType: EventType.Request,
      message: "Test boolean details",
      details: true,
    };

    await service.info(rawLog);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.fields.details).toBe("true");
  });
});
