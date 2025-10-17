import { promises as fs } from "fs";
import path from "path";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { createFileLogger } from "./createFileLogger.js";
import { FileLoggerConfig } from "./interfaces/FileLoggerConfig.js";
import {
  LogLevel,
  TriggerType,
  EnvironmentType,
  EventType,
} from "../enums/index.js";
import { Log } from "../interfaces/Log.js";
import { Logger } from "../interfaces/Logger.js";

vi.mock("fs", () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("path", () => ({
  join: vi.fn((...parts: string[]) => parts.join("/")),
  default: {
    join: vi.fn((...parts: string[]) => parts.join("/")),
  },
}));

describe("LocalFileLogger", () => {
  let logger: Logger;
  const mockConfig: FileLoggerConfig = {
    logsDir: "/custom/logs",
  };

  const fixedTimestamp = 1718901234;
  const mockLog: Log = {
    timestamp: fixedTimestamp * 1_000_000,
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
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(fixedTimestamp);
    vi.useFakeTimers();
    vi.setSystemTime(fixedTimestamp);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("creates logs directory in specified location", async () => {
    logger = createFileLogger(mockConfig);
    await logger.writeLog(mockLog);

    expect(fs.mkdir).toHaveBeenCalledWith("/custom/logs/logs", {
      recursive: true,
    });
  });

  it("creates logs directory in process.cwd() if logsDir not provided", async () => {
    logger = createFileLogger({});
    await logger.writeLog(mockLog);

    expect(path.join).toHaveBeenCalledWith(process.cwd(), "logs");
    expect(fs.mkdir).toHaveBeenCalledWith(`${process.cwd()}/logs`, {
      recursive: true,
    });
  });

  it("writes log with correct format", async () => {
    logger = createFileLogger(mockConfig);
    await logger.writeLog(mockLog);

    const writtenLog = JSON.stringify(mockLog, null, 2);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(`/custom/logs/logs/INFO-${fixedTimestamp}.log`),
      writtenLog,
    );
  });

  it("generates correct filename format", async () => {
    logger = createFileLogger(mockConfig);
    await logger.writeLog(mockLog);

    const [filePath] = vi.mocked(fs.writeFile).mock.calls[0];
    expect(filePath).toBe(`/custom/logs/logs/INFO-${fixedTimestamp}.log`);
  });

  it("handles directory creation errors gracefully", async () => {
    const mkdirError = new Error("Directory access denied");
    vi.mocked(fs.mkdir).mockRejectedValueOnce(mkdirError);

    logger = createFileLogger(mockConfig);

    await expect(logger.writeLog(mockLog)).rejects.toThrow(
      "Не удалось записать данные в локальный файл",
    );
  });

  it("throws error on failed file write", async () => {
    const writeFileError = new Error("Write failed");
    vi.mocked(fs.writeFile).mockRejectedValue(writeFileError);

    logger = createFileLogger(mockConfig);

    await expect(logger.writeLog(mockLog)).rejects.toThrowError(
      new Error("Не удалось записать данные в локальный файл", {
        cause: writeFileError,
      }),
    );
  });

  it("writes log with error field when present", async () => {
    const logWithError: Log = {
      ...mockLog,
      error: "Test error message",
      level: LogLevel.Error,
    };

    logger = createFileLogger(mockConfig);
    await logger.writeLog(logWithError);

    const writtenLog = JSON.stringify(logWithError, null, 2);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(`/custom/logs/logs/ERROR-${fixedTimestamp}.log`),
      writtenLog,
    );
  });

  it("generates different filenames for different log levels", async () => {
    logger = createFileLogger(mockConfig);

    const debugLog: Log = { ...mockLog, level: LogLevel.Debug };
    await logger.writeLog(debugLog);

    const warningLog: Log = { ...mockLog, level: LogLevel.Warning };
    await logger.writeLog(warningLog);

    const criticalLog: Log = { ...mockLog, level: LogLevel.Critical };
    await logger.writeLog(criticalLog);

    const writeFileCalls = vi.mocked(fs.writeFile).mock.calls;

    expect(writeFileCalls[0][0]).toBe(
      `/custom/logs/logs/DEBUG-${fixedTimestamp}.log`,
    );
    expect(writeFileCalls[1][0]).toBe(
      `/custom/logs/logs/WARNING-${fixedTimestamp}.log`,
    );
    expect(writeFileCalls[2][0]).toBe(
      `/custom/logs/logs/CRITICAL-${fixedTimestamp}.log`,
    );
  });

  it("handles log without optional fields", async () => {
    const minimalLog: Log = {
      timestamp: fixedTimestamp * 1_000_000,
      level: LogLevel.Info,
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

    logger = createFileLogger(mockConfig);
    await logger.writeLog(minimalLog);

    const writtenLog = JSON.stringify(minimalLog, null, 2);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(`/custom/logs/logs/INFO-${fixedTimestamp}.log`),
      writtenLog,
    );
  });

  it("uses correct timestamp format in filename", async () => {
    const testTimestamp = 1718901234;

    vi.setSystemTime(testTimestamp);
    vi.spyOn(Date, "now").mockReturnValue(testTimestamp);

    logger = createFileLogger(mockConfig);

    const testLog: Log = {
      ...mockLog,
      timestamp: testTimestamp * 1_000_000,
    };

    await logger.writeLog(testLog);

    const [filePath] = vi.mocked(fs.writeFile).mock.calls[0];
    expect(filePath).toBe(`/custom/logs/logs/INFO-${testTimestamp}.log`);
  });
});
