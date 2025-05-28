import { Log } from "../../../interfaces/Log";
import { Logger } from "../../../interfaces/Logger";
import { createInfluxDbLogger } from "./influxDbLogger";
import { LogLevel } from "../../../enums/LogLevel";
import { TriggerType } from "../../../enums/TriggerType";
import { EnvironmentType } from "../../../enums/EnvironmentType";
import { InfluxDB, Point } from "@influxdata/influxdb-client";

jest.mock("@influxdata/influxdb-client");

const { InfluxDB: InfluxDBMock, Point: PointMock } = jest.mocked({
  InfluxDB,
  Point,
});

describe("InfluxDB Client", () => {
  let influxDbLogger: Logger;
  const mockConfig = {
    url: "http://localhost:8086",
    token: "test-token",
    org: "test-org",
    bucket: "test-bucket",
  };

  const mockPointInstance = {
    measurement: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
    tag: jest.fn().mockReturnThis(),
    floatField: jest.fn().mockReturnThis(),
    stringField: jest.fn().mockReturnThis(),
  };

  const mockWriteApi = {
    writePoint: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(() => {
    (PointMock as jest.Mock).mockImplementation(() => mockPointInstance);
    (InfluxDBMock as jest.Mock).mockImplementation(() => ({
      getWriteApi: jest.fn(() => mockWriteApi),
    }));

    influxDbLogger = createInfluxDbLogger(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const mockLog: Log = {
    measurement: "test_measurement",
    timestamp: Date.now(),
    tags: {
      level: LogLevel.Info,
      currentService: "notification-service",
      callerService: "firebird-queue",
      trigger: TriggerType.Manual,
      environment: EnvironmentType.Development,
      host: "localhost",
    },
    fields: {
      id: "12345",
      message: "Test message",
      durationMs: 150,
      payload: JSON.stringify({ test: "value" }),
    },
  };

  it("should create a Point with correct measurement and timestamp", async () => {
    await influxDbLogger.writeLog(mockLog);

    expect(mockPointInstance.measurement).toHaveBeenCalledWith(
      mockLog.measurement,
    );
    expect(mockPointInstance.timestamp).toHaveBeenCalledWith(mockLog.timestamp);
  });

  it("should add all tags to the Point", async () => {
    await influxDbLogger.writeLog(mockLog);

    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "level",
      mockLog.tags.level,
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "current_service",
      "notification-service",
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "caller_service",
      "firebird-queue",
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "trigger",
      mockLog.tags.trigger,
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "environment",
      mockLog.tags.environment,
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "host",
      mockLog.tags.host,
    );
  });

  it("should add all fields to the Point", async () => {
    await influxDbLogger.writeLog(mockLog);

    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "id",
      mockLog.fields.id,
    );
    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "message",
      mockLog.fields.message,
    );
    expect(mockPointInstance.floatField).toHaveBeenCalledWith(
      "duration_ms",
      mockLog.fields.durationMs,
    );
    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "payload",
      mockLog.fields.payload,
    );
  });

  it("should call writePoint and close on WriteAPI", async () => {
    await influxDbLogger.writeLog(mockLog);

    expect(mockWriteApi.writePoint).toHaveBeenCalled();
    expect(mockWriteApi.close).toHaveBeenCalled();
  });

  it("should not throw error when optional fields are missing", async () => {
    const logWithoutOptionalFields: Log = {
      measurement: "test_measurement",
      timestamp: Date.now(),
      tags: {
        level: LogLevel.Debug,
        trigger: TriggerType.Manual,
        currentService: "notification-service",
      },
      fields: {
        id: "12345",
        message: "Test message",
        durationMs: 150,
      },
    };

    await expect(
      influxDbLogger.writeLog(logWithoutOptionalFields),
    ).resolves.not.toThrow();
  });
});
