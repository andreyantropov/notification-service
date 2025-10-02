import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createFallbackLogger } from "./index.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { TriggerType } from "../../../shared/enums/TriggerType.js";
import { Logger } from "../../ports/Logger.js";
import { Log } from "../../types/Log.js";

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
    measurement: "test_log",
    timestamp: Date.now() * 1_000_000,
    tags: {
      level: LogLevel.Info,
      serviceName: "notification-service",
      trigger: TriggerType.Manual,
    },
    fields: {
      id: "12345",
      message: "Test log message",
      durationMs: 0,
    },
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
});
