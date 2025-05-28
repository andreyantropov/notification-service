import { createFallbackLogger } from ".";
import { Logger } from "../../../interfaces/Logger";
import { Log } from "../../../interfaces/Log";
import { LogLevel } from "../../../enums/LogLevel";
import { TriggerType } from "../../../enums/TriggerType";

type MockLogger = Logger & {
  writeLog: jest.MockedFunction<Logger["writeLog"]>;
};

const createMockLogger = (overrides: Partial<Logger> = {}): MockLogger => {
  return {
    writeLog: jest.fn(),
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
      currentService: "notification-service",
      callerService: "firebird",
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

    fallbackLogger = createFallbackLogger({
      loggers: [loggerA, loggerB],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call the first logger and not use others when successful", async () => {
    loggerA.writeLog.mockResolvedValue(undefined);

    await fallbackLogger.writeLog(mockLog);

    expect(loggerA.writeLog).toHaveBeenCalledWith(mockLog);
    expect(loggerB.writeLog).not.toHaveBeenCalled();
  });

  it("should proceed to the next logger if the previous one fails", async () => {
    const primaryError = new Error("Primary logger failed");

    loggerA.writeLog.mockRejectedValueOnce(primaryError);
    loggerB.writeLog.mockResolvedValue(undefined);

    await fallbackLogger.writeLog(mockLog);

    expect(loggerA.writeLog).toHaveBeenCalledWith(mockLog);
    expect(loggerB.writeLog).toHaveBeenCalledWith(mockLog);
  });

  it("should try all loggers and throw an error if all fail", async () => {
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

  it("should correctly handle 3+ loggers", async () => {
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

  it("should throw an error during creation if the logger list is empty", async () => {
    expect(() =>
      createFallbackLogger({
        loggers: [],
      }),
    ).toThrow("Не указано ни одного логгера");
  });

  it("should pass the log to all loggers until the first success", async () => {
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

  it("should work with a single logger", async () => {
    const singleFallbackLogger = createFallbackLogger({
      loggers: [loggerA],
    });

    loggerA.writeLog.mockResolvedValue(undefined);

    await singleFallbackLogger.writeLog(mockLog);

    expect(loggerA.writeLog).toHaveBeenCalledWith(mockLog);
  });

  it("should only process the loggers provided in the config", async () => {
    const fallbackLogger = createFallbackLogger({
      loggers: [loggerA, loggerB],
    });

    loggerA.writeLog.mockRejectedValue(new Error("DB error"));
    loggerB.writeLog.mockResolvedValue(undefined);

    await fallbackLogger.writeLog(mockLog);

    expect(loggerB.writeLog).toHaveBeenCalled();
  });

  it("should process loggers in the order they were provided", async () => {
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
