import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createLogger } from "./index.js";
import { noop } from "../../../shared/utils/noop/noop.js";
import { TracingContextManager } from "../../ports/TracingContextManager.js";
import {
  EnvironmentType,
  EventType,
  TriggerType,
} from "../../telemetry/logging/index.js";
import { Log } from "../../types/Log.js";

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

describe("createLogger", () => {
  let service: ReturnType<typeof createLogger>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    vi.clearAllMocks();

    mockTracingContextManager.active.mockReturnValue({});
    mockTracingContextManager.getTraceContext.mockReturnValue({
      traceId: "test-trace-id",
      spanId: "test-span-id",
    });

    service = createLogger(
      {
        logger: mockLogger,
        tracingContextManager: mockTracingContextManager,
      },
      {
        serviceName: "isplanar_notification",
        serviceVersion: "1.0.0",
        environment: EnvironmentType.Development,
      },
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should format log with correct structure", async () => {
    const log: Log = {
      eventType: EventType.MessagePublish,
      message: "Test message",
      details: { test: "data" },
    };

    await service.info(log);

    expect(mockWriteLog).toHaveBeenCalled();

    const logArg = mockWriteLog.mock.calls[0][0];

    expect(logArg).toMatchObject({
      level: "INFO",
      serviceName: "isplanar_notification",
      serviceVersion: "1.0.0",
      trigger: TriggerType.Api,
      environment: EnvironmentType.Development,
      eventType: EventType.MessagePublish,
      host: expect.any(String),
      id: expect.any(String),
      message: "Test message",
      durationMs: 0,
      traceId: "test-trace-id",
      spanId: "test-span-id",
      details: JSON.stringify({ test: "data" }),
    });
  });

  it("should handle errors in logs correctly", async () => {
    const error = new Error("Test error");
    const log: Log = {
      eventType: EventType.DependencyFailure,
      message: "Error message",
      error,
    };

    const productionService = createLogger(
      {
        logger: mockLogger,
        tracingContextManager: mockTracingContextManager,
      },
      {
        serviceName: "isplanar_notification",
        serviceVersion: "1.0.0",
        environment: EnvironmentType.Production,
      },
    );

    await productionService.error(log);

    expect(mockWriteLog).toHaveBeenCalled();

    const logArg = mockWriteLog.mock.calls[0][0];

    expect(logArg.level).toBe("ERROR");
    expect(logArg.environment).toBe(EnvironmentType.Production);
    expect(logArg.eventType).toBe(EventType.DependencyFailure);
    expect(logArg.message).toBe("Error message");
    expect(logArg.error).toContain("Test error");
  });

  it("should use different environment based on config", async () => {
    const stagingService = createLogger(
      {
        logger: mockLogger,
        tracingContextManager: mockTracingContextManager,
      },
      {
        serviceName: "test_service",
        serviceVersion: "2.0.0",
        environment: EnvironmentType.Staging,
      },
    );

    const log: Log = {
      eventType: EventType.ExternalCall,
      message: "Test environment",
    };

    await stagingService.warning(log);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.environment).toBe(EnvironmentType.Staging);
    expect(logArg.serviceName).toBe("test_service");
    expect(logArg.serviceVersion).toBe("2.0.0");
  });

  it("should log an error if writing the log fails", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(noop);

    mockWriteLog.mockRejectedValueOnce(new Error("Logging failed"));

    const log: Log = {
      eventType: EventType.CircuitBreaker,
      message: "Fail to log",
    };

    await service.debug(log);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Не удалось записать лог в систему:",
      {
        originalLog: log,
        loggingError: expect.any(Error),
      },
    );

    consoleErrorSpy.mockRestore();
  });

  it("should call correct log level methods", async () => {
    const log: Log = {
      eventType: EventType.Request,
      message: "Test message",
    };

    await service.debug(log);
    expect(mockWriteLog.mock.calls[0][0].level).toBe("DEBUG");

    await service.info(log);
    expect(mockWriteLog.mock.calls[1][0].level).toBe("INFO");

    await service.warning(log);
    expect(mockWriteLog.mock.calls[2][0].level).toBe("WARNING");

    await service.error(log);
    expect(mockWriteLog.mock.calls[3][0].level).toBe("ERROR");

    await service.critical(log);
    expect(mockWriteLog.mock.calls[4][0].level).toBe("CRITICAL");
  });

  it("should handle duration in logs", async () => {
    const log: Log = {
      eventType: EventType.Request,
      message: "Test with duration",
      duration: 150,
    };

    await service.info(log);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.durationMs).toBe(150);
  });

  it("should handle missing tracing context", async () => {
    mockTracingContextManager.getTraceContext.mockReturnValueOnce(null);

    const log: Log = {
      eventType: EventType.Command,
      message: "Test without trace",
    };

    await service.info(log);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.traceId).toBeUndefined();
    expect(logArg.spanId).toBeUndefined();
  });

  it("should safely stringify circular objects", async () => {
    const circularObj: Record<string, unknown> = { test: "data" };
    circularObj.self = circularObj;

    const log: Log = {
      eventType: EventType.Query,
      message: "Test circular",
      details: circularObj,
    };

    await service.info(log);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.details).toBeUndefined();
  });

  it("should handle string details without double-stringifying", async () => {
    const log: Log = {
      eventType: EventType.MessageConsume,
      message: "Test string details",
      details: "plain string",
    };

    await service.info(log);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.details).toBe("plain string");
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
      const log: Log = {
        eventType,
        message: `Test for ${eventType}`,
      };

      await service.info(log);
      const lastCall =
        mockWriteLog.mock.calls[mockWriteLog.mock.calls.length - 1][0];
      expect(lastCall.eventType).toBe(eventType);
    }
  });

  it("should handle undefined details", async () => {
    const log: Log = {
      eventType: EventType.Request,
      message: "Test undefined details",
    };

    await service.info(log);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.details).toBeUndefined();
  });

  it("should handle null details", async () => {
    const log: Log = {
      eventType: EventType.Request,
      message: "Test null details",
      details: null,
    };

    await service.info(log);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.details).toBe("null");
  });

  it("should handle number details", async () => {
    const log: Log = {
      eventType: EventType.Request,
      message: "Test number details",
      details: 42,
    };

    await service.info(log);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.details).toBe("42");
  });

  it("should handle boolean details", async () => {
    const log: Log = {
      eventType: EventType.Request,
      message: "Test boolean details",
      details: true,
    };

    await service.info(log);

    const logArg = mockWriteLog.mock.calls[0][0];
    expect(logArg.details).toBe("true");
  });
});
