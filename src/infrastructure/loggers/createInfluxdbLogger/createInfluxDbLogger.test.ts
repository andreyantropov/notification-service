import { createInfluxDbLogger } from "./createInfluxDbLogger.js";
import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { EnvironmentType } from "../../../shared/enums/EnvironmentType.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { TriggerType } from "../../../shared/enums/TriggerType.js";
import { Logger } from "../../../application/ports/Logger.js";
import { Log } from "../../../application/ports/Log.js";

vi.mock("@influxdata/influxdb-client");

const InfluxDBMock = vi.mocked(InfluxDB);
const PointMock = vi.mocked(Point);

describe("InfluxDB Client", () => {
  let influxDbLogger: Logger;
  const mockConfig = {
    url: "http://localhost:8086",
    token: "test-token",
    org: "test-org",
    bucket: "test-bucket",
  };

  const mockPointInstance = {
    measurement: vi.fn().mockReturnThis(),
    timestamp: vi.fn().mockReturnThis(),
    tag: vi.fn().mockReturnThis(),
    floatField: vi.fn().mockReturnThis(),
    stringField: vi.fn().mockReturnThis(),
  };

  const mockWriteApi = {
    writePoint: vi.fn(),
    close: vi.fn(),
  };

  beforeEach(() => {
    (
      PointMock as unknown as {
        mockImplementation: (fn: () => unknown) => void;
      }
    ).mockImplementation(() => mockPointInstance);

    (
      InfluxDBMock as unknown as {
        mockImplementation: (fn: () => unknown) => void;
      }
    ).mockImplementation(() => ({
      getWriteApi: vi.fn(() => mockWriteApi),
    }));

    influxDbLogger = createInfluxDbLogger(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
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
