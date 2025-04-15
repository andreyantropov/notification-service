import { log } from "./log";
import { writeLog as writeLogToDatabase } from "../influxdb/influxdb";
import fs from "fs";
import { LogLevel } from "../../enum/LogLevel";
import { TriggerType } from "../../enum/TriggerType";
import path from "path";

jest.mock("../influxdb/influxdb", () => ({
  writeLog: jest.fn(),
}));

jest.mock("fs", () => ({
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

describe("log function", () => {
  const mockMessage = "Test log message";
  const mockPayload = { key: "value" };
  const mockError = new Error("Test error");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should successfully log to the database", async () => {
    const writeLogToDatabaseMock = writeLogToDatabase as jest.Mock;

    await log(LogLevel.Info, mockMessage);

    expect(writeLogToDatabaseMock).toHaveBeenCalledTimes(1);
    const logObject = writeLogToDatabaseMock.mock.calls[0][0];
    expect(logObject.tags.level).toBe(LogLevel.Info);
    expect(logObject.fields.message).toBe(mockMessage);
  });

  it("should fallback to file logging if database logging fails", async () => {
    const writeLogToDatabaseMock = writeLogToDatabase as jest.Mock;
    const writeFileMock = fs.promises.writeFile as jest.Mock;

    writeLogToDatabaseMock.mockImplementation(() => {
      throw new Error("Database error");
    });

    await log(LogLevel.Error, mockMessage, {
      callerService: "CallerService",
      trigger: TriggerType.Manual,
      payload: mockPayload,
      error: mockError,
    });

    expect(writeLogToDatabaseMock).toHaveBeenCalledTimes(1);

    expect(writeFileMock).toHaveBeenCalledTimes(1);

    const [filePath, fileContent] = writeFileMock.mock.calls[0];
    const logObject = JSON.parse(fileContent);

    const logsDir = path.join(__dirname, "../../../logs");
    const normalizedFilePath = path.normalize(filePath);

    expect(normalizedFilePath.startsWith(logsDir)).toBe(true);
    expect(path.extname(normalizedFilePath)).toBe(".log");

    expect(logObject.measurement).toBe("isplanar-notification-logs");
    expect(logObject.tags.level).toBe(LogLevel.Error);
    expect(logObject.fields.message).toBe(mockMessage);
    expect(logObject.fields.payload).toBe(JSON.stringify(mockPayload));
    expect(logObject.fields.error).toBe(JSON.stringify(mockError));
  });

  it("should fallback to console logging if file logging fails", async () => {
    const writeLogToDatabaseMock = writeLogToDatabase as jest.Mock;
    writeLogToDatabaseMock.mockImplementation(() => {
      throw new Error("Database error");
    });
    const writeFileMock = fs.promises.writeFile as jest.Mock;
    writeFileMock.mockImplementation(() => {
      throw new Error("File system error");
    });
    console.log = jest.fn();

    await log(LogLevel.Warning, mockMessage, { error: mockError });

    expect(writeLogToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledTimes(1);
    const logOutput = (console.log as jest.Mock).mock.calls[0][0];
    const logObject = JSON.parse(logOutput);
    expect(logObject.tags.level).toBe(LogLevel.Warning);
    expect(logObject.fields.error).toBe(JSON.stringify(mockError));
  });

  it("should fallback to console logging if file logging fails", async () => {
    const writeLogToDatabaseMock = writeLogToDatabase as jest.Mock;
    writeLogToDatabaseMock.mockImplementation(() => {
      throw new Error("Database error");
    });
    const writeFileMock = fs.promises.writeFile as jest.Mock;
    writeFileMock.mockImplementation(() => {
      throw new Error("File system error");
    });
    console.log = jest.fn();

    await log(LogLevel.Warning, mockMessage, { error: mockError });

    expect(writeLogToDatabaseMock).toHaveBeenCalledTimes(1);
    expect(writeFileMock).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenCalledTimes(1);
    const logOutput = (console.log as jest.Mock).mock.calls[0][0];
    const logObject = JSON.parse(logOutput);
    expect(logObject.tags.level).toBe(LogLevel.Warning);
    expect(logObject.fields.error).toBe(JSON.stringify(mockError));
  });

  it("should correctly populate log object with all options", async () => {
    const writeLogToDatabaseMock = writeLogToDatabase as jest.Mock;

    await log(LogLevel.Debug, mockMessage, {
      callerService: "CallerService",
      trigger: TriggerType.Manual,
      payload: mockPayload,
      error: mockError,
    });

    expect(writeLogToDatabaseMock).toHaveBeenCalledTimes(1);
    const logObject = writeLogToDatabaseMock.mock.calls[0][0];
    expect(logObject.tags.level).toBe(LogLevel.Debug);
    expect(logObject.tags.callerService).toBe("CallerService");
    expect(logObject.tags.trigger).toBe(TriggerType.Manual);
    expect(logObject.fields.payload).toBe(JSON.stringify(mockPayload));
    expect(logObject.fields.error).toBe(JSON.stringify(mockError));
  });
});
