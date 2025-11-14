import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

import { EventType } from "../../../../../application/enums/EventType.js";
import { TriggerType } from "../../../../../application/enums/TriggerType.js";
import { Logger } from "../../../../../application/ports/Logger.js";
import { Log } from "../../../../../application/types/Log.js";

describe("createLogger", () => {
  let logger: Logger;
  let logSpy: Mock;
  let mockV4: Mock;

  beforeEach(async () => {
    vi.clearAllMocks();

    logSpy = vi.fn();
    mockV4 = vi.fn(() => "test-uuid-123");

    vi.doMock("uuid", () => ({
      v4: mockV4,
    }));

    vi.doMock("winston", () => ({
      default: {
        addColors: vi.fn(),
        createLogger: vi.fn(() => ({
          log: logSpy,
        })),
      },
      createLogger: vi.fn(() => ({
        log: logSpy,
      })),
      addColors: vi.fn(),
      format: {
        combine: vi.fn(),
        timestamp: vi.fn(),
        errors: vi.fn(),
        json: vi.fn(),
      },
      transports: {
        Console: vi.fn(),
      },
    }));

    vi.doMock("@opentelemetry/winston-transport", () => ({
      OpenTelemetryTransportV3: vi.fn(),
    }));

    const { createLogger } = await import("./createLogger.js");
    logger = createLogger();
  });

  afterEach(() => {
    vi.doUnmock("uuid");
    vi.doUnmock("winston");
    vi.doUnmock("@opentelemetry/winston-transport");
  });

  it("should call winston.log with 'critical' level for critical()", () => {
    const logData: Log = {
      message: "System down",
      eventType: EventType.InfrastructureFailure,
    };
    logger.critical(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "critical",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        eventType: EventType.InfrastructureFailure,
        duration: 0,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should call winston.log with 'error' level for error()", () => {
    const error = new Error("DB connection failed");
    const logData: Log = {
      message: "Database error",
      error,
      eventType: EventType.DependencyFailure,
    };

    logger.error(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "error",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        message: "DB connection failed",
        name: "Error",
        stack: expect.stringContaining("Error: DB connection failed"),
        eventType: EventType.DependencyFailure,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should call winston.log with 'warn' level for warning()", () => {
    const logData: Log = {
      message: "Deprecated endpoint used",
      eventType: EventType.AuthAttempt,
    };
    logger.warning(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "warn",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        eventType: EventType.AuthAttempt,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should call winston.log with 'info' level for info()", () => {
    const logData: Log = {
      message: "User requested data",
      eventType: EventType.Request,
      details: { userId: "u-123", path: "/api/data" },
    };
    logger.info(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "info",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        userId: "u-123",
        path: "/api/data",
        eventType: EventType.Request,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should call winston.log with 'debug' level for debug()", () => {
    const logData: Log = {
      message: "Cache miss",
      eventType: EventType.CacheOperation,
      duration: 15,
    };
    logger.debug(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "debug",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        duration: 15,
        eventType: EventType.CacheOperation,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should omit 'details' field when not provided", () => {
    const logData: Log = {
      message: "Simple log",
      eventType: EventType.HealthCheck,
    };
    logger.info(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "info",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        eventType: EventType.HealthCheck,
        trigger: TriggerType.Api,
        duration: 0,
      }),
    );

    const meta = logSpy.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(meta).not.toHaveProperty("userId");
    expect(meta).not.toHaveProperty("path");
  });

  it("should omit 'error' field when not provided", () => {
    const logData: Log = {
      message: "Healthy",
      eventType: EventType.HealthCheck,
    };
    logger.info(logData);

    const meta = logSpy.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(meta).not.toHaveProperty("message");
    expect(meta).not.toHaveProperty("name");
    expect(meta).not.toHaveProperty("stack");
  });

  it("should serialize non-Error objects passed as error", () => {
    const rawError = { code: "ERR_404", message: "Not found" };
    const logData: Log = {
      message: "External API error",
      error: rawError,
      eventType: EventType.ExternalCall,
    };

    logger.error(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "error",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        code: "ERR_404",
        message: "Not found",
        eventType: EventType.ExternalCall,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should set duration to 0 when duration is undefined", () => {
    const logData: Log = {
      message: "No duration",
      eventType: EventType.CronJob,
    };
    logger.info(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "info",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        duration: 0,
        eventType: EventType.CronJob,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should preserve provided duration value", () => {
    const logData: Log = {
      message: "Query took time",
      eventType: EventType.Query,
      duration: 250,
    };
    logger.info(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "info",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        duration: 250,
        eventType: EventType.Query,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should preserve duration value when duration is 0", () => {
    const logData: Log = {
      message: "Query took no time",
      eventType: EventType.Query,
      duration: 0,
    };
    logger.info(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "info",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        duration: 0,
        eventType: EventType.Query,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should return a resolved Promise<void>", async () => {
    const logData: Log = { message: "Async compatibility" };
    const result = logger.info(logData);

    await expect(result).resolves.toBeUndefined();
  });

  it("should handle log with only message (minimal case)", () => {
    const logData: Log = { message: "Minimal log" };
    logger.debug(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "debug",
      "Minimal log",
      expect.objectContaining({
        id: "test-uuid-123",
        eventType: undefined,
        duration: 0,
        trigger: TriggerType.Api,
      }),
    );
  });
});
