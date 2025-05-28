import { promises as fs } from "fs";
import path from "path";
import { LogLevel } from "../../../enums/LogLevel";
import { Log } from "../../../interfaces/Log";
import { Logger } from "../../../interfaces/Logger";
import { createLocalFileLogger } from "./localFileLogger";
import { LocalFileLoggerConfig } from "./interfaces/LocalFileLoggerConfig";
import { TriggerType } from "../../../enums/TriggerType";

jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
}));

jest.mock("path", () => ({
  join: jest.fn((...parts) => parts.join("/")),
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
    jest.clearAllMocks();
    jest.spyOn(Date, "now").mockReturnValue(fixedTimestamp);
    const mockDate = new Date(fixedTimestamp);
    jest
      .spyOn(global, "Date")
      .mockImplementation(() => mockDate as unknown as Date);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should create logs directory in specified location", async () => {
    logger = createLocalFileLogger(mockConfig);
    await logger.writeLog(mockLog);

    expect(fs.mkdir).toHaveBeenCalledWith("/custom/logs/logs", {
      recursive: true,
    });
  });

  it("should create logs directory in process.cwd() if logsDir not provided", async () => {
    logger = createLocalFileLogger({});
    await logger.writeLog(mockLog);

    expect(path.join).toHaveBeenCalledWith(process.cwd(), "logs");
    expect(fs.mkdir).toHaveBeenCalledWith(`${process.cwd()}/logs`, {
      recursive: true,
    });
  });

  it("should write log with correct format", async () => {
    logger = createLocalFileLogger(mockConfig);
    await logger.writeLog(mockLog);

    const writtenLog = JSON.stringify(mockLog, null, 2);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining(`/custom/logs/logs/INFO-${fixedTimestamp}.log`),
      writtenLog,
    );
  });

  it("should generate correct filename format", async () => {
    logger = createLocalFileLogger(mockConfig);
    await logger.writeLog(mockLog);

    const [filePath] = (fs.writeFile as jest.Mock).mock.calls[0];
    expect(filePath).toBe(`/custom/logs/logs/INFO-${fixedTimestamp}.log`);
  });

  it("should handle directory creation errors gracefully", async () => {
    const mkdirError = new Error("Directory access denied");
    (fs.mkdir as jest.Mock).mockRejectedValueOnce(mkdirError);

    logger = createLocalFileLogger(mockConfig);

    await expect(logger.writeLog(mockLog)).rejects.toThrow(
      "Не удалось записать данные в локальный файл",
    );
  });

  it("should throw error on failed file write", async () => {
    const writeFileError = new Error("Write failed");
    (fs.writeFile as jest.Mock).mockRejectedValue(writeFileError);

    logger = createLocalFileLogger(mockConfig);

    await expect(logger.writeLog(mockLog)).rejects.toThrowError(
      new Error("Не удалось записать данные в локальный файл", {
        cause: writeFileError,
      }),
    );
  });
});
