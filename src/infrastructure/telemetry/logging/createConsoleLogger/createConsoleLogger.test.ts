import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createConsoleLogger } from "./createConsoleLogger.js";
import {
  LogLevel,
  TriggerType,
  EnvironmentType,
  EventType,
} from "../enums/index.js";
import { Log } from "../interfaces/Log.js";

const mockConsoleLog = vi.fn();

describe("createConsoleLogger", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(mockConsoleLog);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should log a valid Log object as a JSON string to console", async () => {
    const logger = createConsoleLogger();
    const log: Log = {
      timestamp: 1718901234,
      level: LogLevel.Info,
      serviceName: "test-service",
      serviceVersion: "1.0.0",
      trigger: TriggerType.Api,
      environment: EnvironmentType.Production,
      eventType: EventType.Request,
      host: "localhost",
      id: "123e4567-e89b-12d3-a456-426614174000",
      message: "Test log message",
      durationMs: 150,
      traceId: "trace-123",
      spanId: "span-456",
      details: JSON.stringify({ test: "data" }),
      error: undefined,
    };

    await logger.writeLog(log);

    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(log));
  });

  it("should throw an error if console.log throws an exception", async () => {
    const logger = createConsoleLogger();
    const log: Log = {
      timestamp: 1718901234,
      level: LogLevel.Error,
      serviceName: "test-service",
      serviceVersion: "1.0.0",
      trigger: TriggerType.Api,
      environment: EnvironmentType.Production,
      eventType: EventType.Command,
      host: "localhost",
      id: "error-id",
      message: "Error test",
      durationMs: 0,
    };

    vi.spyOn(console, "log").mockImplementation(() => {
      throw new Error("Console write failed");
    });

    await expect(logger.writeLog(log)).rejects.toThrow(
      "Не удалось записать данные в консоль",
    );

    try {
      await logger.writeLog(log);
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(Error);
      if (error instanceof Error) {
        expect(error.cause).toBeDefined();
        expect((error.cause as Error).message).toBe("Console write failed");
      }
    }
  });

  it("should handle minimal Log object without optional fields", async () => {
    const logger = createConsoleLogger();
    const minimalLog: Log = {
      timestamp: 1234567890000,
      level: LogLevel.Debug,
      serviceName: "test-service",
      serviceVersion: "1.0.0",
      trigger: TriggerType.Api,
      environment: EnvironmentType.Development,
      eventType: EventType.Command,
      host: "localhost",
      id: "min-id",
      message: "Minimal log",
      durationMs: 0,
    };

    await logger.writeLog(minimalLog);

    expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(minimalLog));
  });

  it("should handle log with error field", async () => {
    const logger = createConsoleLogger();
    const logWithError: Log = {
      timestamp: 1718901234,
      level: LogLevel.Error,
      serviceName: "test-service",
      serviceVersion: "1.0.0",
      trigger: TriggerType.Api,
      environment: EnvironmentType.Production,
      eventType: EventType.DependencyFailure,
      host: "localhost",
      id: "error-log-id",
      message: "Something went wrong",
      durationMs: 0,
      error: "Test error message",
    };

    await logger.writeLog(logWithError);

    expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(logWithError));
  });

  it("should handle log with all optional fields", async () => {
    const logger = createConsoleLogger();
    const fullLog: Log = {
      timestamp: 1718901234,
      level: LogLevel.Info,
      serviceName: "test-service",
      serviceVersion: "1.0.0",
      trigger: TriggerType.Api,
      environment: EnvironmentType.Staging,
      eventType: EventType.ExternalCall,
      host: "server-01",
      id: "full-log-id",
      message: "Complete log message",
      durationMs: 250,
      traceId: "trace-full-123",
      spanId: "span-full-456",
      details: JSON.stringify({ userId: 123, action: "login" }),
      error: undefined,
    };

    await logger.writeLog(fullLog);

    expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(fullLog));
  });

  it("should handle different log levels correctly", async () => {
    const logger = createConsoleLogger();

    const levels = [
      LogLevel.Debug,
      LogLevel.Info,
      LogLevel.Warning,
      LogLevel.Error,
      LogLevel.Critical,
    ];

    for (const level of levels) {
      const log: Log = {
        timestamp: 1718901234,
        level,
        serviceName: "test-service",
        serviceVersion: "1.0.0",
        trigger: TriggerType.Api,
        environment: EnvironmentType.Development,
        eventType: EventType.Request,
        host: "localhost",
        id: `log-${level.toLowerCase()}`,
        message: `Test ${level} log`,
        durationMs: 100,
      };

      await logger.writeLog(log);
    }

    expect(mockConsoleLog).toHaveBeenCalledTimes(levels.length);

    const calls = mockConsoleLog.mock.calls;
    for (let i = 0; i < levels.length; i++) {
      const loggedObject = JSON.parse(calls[i][0]);
      expect(loggedObject.level).toBe(levels[i]);
    }
  });
});
