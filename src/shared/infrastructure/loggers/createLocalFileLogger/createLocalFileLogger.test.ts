import { promises as fs } from "fs";
import path from "path";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LogLevel } from "../../../enums/LogLevel.js";
import type { Log } from "../../../interfaces/Log.js";
import type { Logger } from "../../../interfaces/Logger.js";
import { createLocalFileLogger } from "./createLocalFileLogger.js";
import type { LocalFileLoggerConfig } from "./interfaces/LocalFileLoggerConfig.js";
import { TriggerType } from "../../../enums/TriggerType.js";

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
  const mockConfig: LocalFileLoggerConfig = {
    logsDir: "/custom/logs",
  };

  const fixedTimestamp = Date.now();
  const mockLog: Log = {
    measurement: "test_log",
    timestamp: fixedTimestamp,
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
    vi.clearAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(fixedTimestamp);
    const mockDate = new Date(fixedTimestamp);
    vi.spyOn(global, "Date").mockImplementation(
      () => mockDate as unknown as Date,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates logs directory in specified location", async () => {
    logger = createLocalFileLogger(mockConfig);
    await logger.writeLog(mockLog);

    expect(fs.mkdir).toHaveBeenCalledWith("/custom/logs/logs", {
      recursive: true,
    });
  });

  it("creates logs directory in process.cwd() if logsDir not provided", async () => {
    logger = createLocalFileLogger({});
    await logger.writeLog(mockLog);

    expect(path.join).toHaveBeenCalledWith(process.cwd(), "logs");
    expect(fs.mkdir).toHaveBeenCalledWith(`${process.cwd()}/logs`, {
      recursive: true,
    });
  });

  it("writes log with correct format", async () => {
    logger = createLocalFileLogger(mockConfig);
    await logger.writeLog(mockLog);

    const writtenLog = JSON.stringify(mockLog, null, 2);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(`/custom/logs/logs/INFO-${fixedTimestamp}.log`),
      writtenLog,
    );
  });

  it("generates correct filename format", async () => {
    logger = createLocalFileLogger(mockConfig);
    await logger.writeLog(mockLog);

    const [filePath] = vi.mocked(fs.writeFile).mock.calls[0];
    expect(filePath).toBe(`/custom/logs/logs/INFO-${fixedTimestamp}.log`);
  });

  it("handles directory creation errors gracefully", async () => {
    const mkdirError = new Error("Directory access denied");
    vi.mocked(fs.mkdir).mockRejectedValueOnce(mkdirError);

    logger = createLocalFileLogger(mockConfig);

    await expect(logger.writeLog(mockLog)).rejects.toThrow(
      "Не удалось записать данные в локальный файл",
    );
  });

  it("throws error on failed file write", async () => {
    const writeFileError = new Error("Write failed");
    vi.mocked(fs.writeFile).mockRejectedValue(writeFileError);

    logger = createLocalFileLogger(mockConfig);

    await expect(logger.writeLog(mockLog)).rejects.toThrowError(
      new Error("Не удалось записать данные в локальный файл", {
        cause: writeFileError,
      }),
    );
  });
});
