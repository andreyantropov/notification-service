import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createFallbackLogger } from "./index.js";
import {
  LogLevel,
  TriggerType,
  EnvironmentType,
  EventType,
} from "../../enums/index.js";
import { Log } from "../../interfaces/Log.js";
import { Logger } from "../../interfaces/Logger.js";

type MockLogger = Logger & {
  writeLog: ReturnType<typeof vi.fn>;
};

const createMockLogger = (overrides: Partial<Logger> = {}): MockLogger => {
  return {
    writeLog: vi.fn(),
    ...overrides,
  } as MockLogger;
};

describe("createFallbackLogger", () => {
  let loggerA: MockLogger;
  let loggerB: MockLogger;
  let fallbackLogger: Logger;

  const mockLog: Log = {
    timestamp: 1718901234,
    level: LogLevel.Info,
    serviceName: "notification-service",
    serviceVersion: "1.0.0",
    trigger: TriggerType.Api,
    environment: EnvironmentType.Development,
    eventType: EventType.Command,
    host: "localhost",
    id: "12345",
    message: "Test log message",
    durationMs: 150,
    traceId: "test-trace-id",
    spanId: "test-span-id",
    details: JSON.stringify({ test: "value" }),
    error: undefined,
  };

  beforeEach(() => {
    loggerA = createMockLogger();
    loggerB = createMockLogger();

    fallbackLogger = createFallbackLogger({ loggers: [loggerA, loggerB] });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("calls the first logger and not use others when successful", async () => {
    loggerA.writeLog.mockResolvedValue(undefined);

    await fallbackLogger.writeLog(mockLog);

    expect(loggerA.writeLog).toHaveBeenCalledWith(mockLog);
    expect(loggerB.writeLog).not.toHaveBeenCalled();
  });

  it("proceeds to the next logger if the previous one fails", async () => {
    const primaryError = new Error("Primary logger failed");

    loggerA.writeLog.mockRejectedValueOnce(primaryError);
    loggerB.writeLog.mockResolvedValue(undefined);

    await fallbackLogger.writeLog(mockLog);

    expect(loggerA.writeLog).toHaveBeenCalledWith(mockLog);
    expect(loggerB.writeLog).toHaveBeenCalledWith(mockLog);
  });

  it("tries all loggers and throws an error if all fail", async () => {
    const errorA = new Error("Logger A failed");
    const errorB = new Error("Logger B failed");

    loggerA.writeLog.mockRejectedValueOnce(errorA);
    loggerB.writeLog.mockRejectedValueOnce(errorB);

    await expect(fallbackLogger.writeLog(mockLog)).rejects.toThrow(
      "Не удалось записать лог ни одним из логгеров",
    );

    expect(loggerA.writeLog).toHaveBeenCalledTimes(1);
    expect(loggerB.writeLog).toHaveBeenCalledTimes(1);
  });

  it("correctly handles 3+ loggers", async () => {
    const loggerC = createMockLogger();
    const fallbackLoggerWithMany = createFallbackLogger({
      loggers: [loggerA, loggerB, loggerC],
    });

    const errorA = new Error("Logger A failed");
    const errorB = new Error("Logger B failed");

    loggerA.writeLog.mockRejectedValueOnce(errorA);
    loggerB.writeLog.mockRejectedValueOnce(errorB);
    loggerC.writeLog.mockResolvedValue(undefined);

    await fallbackLoggerWithMany.writeLog(mockLog);

    expect(loggerA.writeLog).toHaveBeenCalledWith(mockLog);
    expect(loggerB.writeLog).toHaveBeenCalledWith(mockLog);
    expect(loggerC.writeLog).toHaveBeenCalledWith(mockLog);
  });

  it("throws an error during creation if the logger list is empty", () => {
    expect(() => createFallbackLogger({ loggers: [] })).toThrow(
      "Не указано ни одного логгера",
    );
  });

  it("passes the log to all loggers until the first success", async () => {
    const loggerC = createMockLogger();
    const fallbackLoggerWithThree = createFallbackLogger({
      loggers: [loggerA, loggerB, loggerC],
    });

    const errorA = new Error("Logger A failed");
    const errorB = new Error("Logger B failed");

    loggerA.writeLog.mockRejectedValueOnce(errorA);
    loggerB.writeLog.mockRejectedValueOnce(errorB);
    loggerC.writeLog.mockResolvedValue(undefined);

    await fallbackLoggerWithThree.writeLog(mockLog);

    expect(loggerA.writeLog).toHaveBeenCalledTimes(1);
    expect(loggerB.writeLog).toHaveBeenCalledTimes(1);
    expect(loggerC.writeLog).toHaveBeenCalledTimes(1);
  });

  it("works with a single logger", async () => {
    const singleFallbackLogger = createFallbackLogger({ loggers: [loggerA] });

    loggerA.writeLog.mockResolvedValue(undefined);

    await singleFallbackLogger.writeLog(mockLog);

    expect(loggerA.writeLog).toHaveBeenCalledWith(mockLog);
  });

  it("only processes the loggers provided in the config", async () => {
    const fallbackLogger = createFallbackLogger({
      loggers: [loggerA, loggerB],
    });

    loggerA.writeLog.mockRejectedValue(new Error("DB error"));
    loggerB.writeLog.mockResolvedValue(undefined);

    await fallbackLogger.writeLog(mockLog);

    expect(loggerB.writeLog).toHaveBeenCalled();
  });

  it("processes loggers in the order they were provided", async () => {
    const loggerC = createMockLogger();
    const orderedFallbackLogger = createFallbackLogger({
      loggers: [loggerA, loggerB, loggerC],
    });

    const errorA = new Error("First logger failed");
    loggerA.writeLog.mockRejectedValueOnce(errorA);
    loggerB.writeLog.mockResolvedValue(undefined);

    await orderedFallbackLogger.writeLog(mockLog);

    expect(loggerA.writeLog).toHaveBeenCalledWith(mockLog);
    expect(loggerB.writeLog).toHaveBeenCalledWith(mockLog);
    expect(loggerC.writeLog).not.toHaveBeenCalled();
  });

  it("calls onError callback when logger fails", async () => {
    const onError = vi.fn();
    const errorA = new Error("Logger A failed");

    const fallbackLoggerWithCallback = createFallbackLogger(
      { loggers: [loggerA, loggerB] },
      { onError },
    );

    loggerA.writeLog.mockRejectedValueOnce(errorA);
    loggerB.writeLog.mockResolvedValue(undefined);

    await fallbackLoggerWithCallback.writeLog(mockLog);

    expect(onError).toHaveBeenCalledWith(mockLog, expect.any(Error));

    const errorPassed = onError.mock.calls[0][1] as Error;
    expect(errorPassed.message).toBe("Ошибка записи лога в цепочке Fallback");
    expect(errorPassed.cause).toBe(errorA);
  });

  it("handles minimal log structure correctly", async () => {
    const minimalLog: Log = {
      timestamp: 1718901234,
      level: LogLevel.Debug,
      serviceName: "test-service",
      serviceVersion: "1.0.0",
      trigger: TriggerType.Api,
      environment: EnvironmentType.Development,
      eventType: EventType.Command,
      host: "localhost",
      id: "minimal-id",
      message: "Minimal log message",
      durationMs: 0,
    };

    loggerA.writeLog.mockResolvedValue(undefined);

    await fallbackLogger.writeLog(minimalLog);

    expect(loggerA.writeLog).toHaveBeenCalledWith(minimalLog);
  });

  it("handles log with error field correctly", async () => {
    const logWithError: Log = {
      ...mockLog,
      level: LogLevel.Error,
      error: "Test error message",
    };

    loggerA.writeLog.mockResolvedValue(undefined);

    await fallbackLogger.writeLog(logWithError);

    expect(loggerA.writeLog).toHaveBeenCalledWith(logWithError);
  });
});
