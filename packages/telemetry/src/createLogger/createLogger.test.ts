import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Mock } from "vitest";

import { EventType, TriggerType } from "@notification-platform/shared";
import type { Log, Logger } from "@notification-platform/shared";

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
        event_type: EventType.InfrastructureFailure,
        durationMs: 0,
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
        event_type: EventType.DependencyFailure,
        durationMs: 0,
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
        event_type: EventType.AuthAttempt,
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
        user_id: "u-123",
        path: "/api/data",
        event_type: EventType.Request,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should call winston.log with 'debug' level for debug()", () => {
    const logData: Log = {
      message: "Cache miss",
      eventType: EventType.CacheOperation,
      durationMs: 15,
    };
    logger.debug(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "debug",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        durationMs: 15,
        event_type: EventType.CacheOperation,
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
        event_type: EventType.HealthCheck,
        trigger: TriggerType.Api,
        durationMs: 0,
      }),
    );

    const meta = logSpy.mock.calls[0]?.[2] as Record<string, unknown>;
    expect(meta).not.toHaveProperty("user_id");
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

  it("should serialize non-Error objects passed as error and convert keys to snake_case", () => {
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
        event_type: EventType.ExternalCall,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should set durationMs to 0 when durationMs is undefined", () => {
    const logData: Log = {
      message: "No durationMs",
      eventType: EventType.CronJob,
    };
    logger.info(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "info",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        durationMs: 0,
        event_type: EventType.CronJob,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should preserve provided durationMs value", () => {
    const logData: Log = {
      message: "Query took time",
      eventType: EventType.Query,
      durationMs: 250,
    };
    logger.info(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "info",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        durationMs: 250,
        event_type: EventType.Query,
        trigger: TriggerType.Api,
      }),
    );
  });

  it("should preserve durationMs value when durationMs is 0", () => {
    const logData: Log = {
      message: "Query took no time",
      eventType: EventType.Query,
      durationMs: 0,
    };
    logger.info(logData);

    expect(logSpy).toHaveBeenCalledWith(
      "info",
      logData.message,
      expect.objectContaining({
        id: "test-uuid-123",
        durationMs: 0,
        event_type: EventType.Query,
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
        event_type: undefined,
        durationMs: 0,
        trigger: TriggerType.Api,
      }),
    );
  });
});
