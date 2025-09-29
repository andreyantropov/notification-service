import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createConsoleLogger } from "./createConsoleLogger.js";
import { EnvironmentType } from "../../../shared/enums/EnvironmentType.js";
import { EventType } from "../../../shared/enums/EventType.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { TriggerType } from "../../../shared/enums/TriggerType.js";
import type { Log } from "../../types/Log.js";

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
      measurement: "test-measurement",
      timestamp: Date.now(),
      tags: {
        level: LogLevel.Info,
        serviceName: "test-service",
        serviceVersion: "1.0.0",
        trigger: TriggerType.Api,
        environment: EnvironmentType.Production,
        eventType: EventType.Request,
        host: "localhost",
      },
      fields: {
        id: "123e4567-e89b-12d3-a456-426614174000",
        message: "Test log message",
        durationMs: 150,
        traceId: "trace-123",
        spanId: "span-456",
        details: "Some extra details",
        error: undefined,
      },
    };

    await logger.writeLog(log);

    expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(log));
  });

  it("should throw an error if console.log throws an exception", async () => {
    const logger = createConsoleLogger();
    const log: Log = {
      measurement: "error-test",
      timestamp: Date.now(),
      tags: { level: LogLevel.Error },
      fields: { id: "id", message: "Error test" },
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
      measurement: "minimal",
      timestamp: 1234567890,
      tags: {
        level: LogLevel.Debug,
      },
      fields: {
        id: "min-id",
        message: "Minimal log",
      },
    };

    await logger.writeLog(minimalLog);

    expect(mockConsoleLog).toHaveBeenCalledWith(JSON.stringify(minimalLog));
  });
});
