import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

import { createInfluxDBLogger } from "./createInfluxDBLogger.js";
import {
  LogLevel,
  TriggerType,
  EnvironmentType,
  EventType,
} from "../enums/index.js";
import { Log } from "../interfaces/Log.js";
import { Logger } from "../interfaces/Logger.js";

vi.mock("@influxdata/influxdb-client");

const InfluxDBMock = vi.mocked(InfluxDB);
const PointMock = vi.mocked(Point);

describe("InfluxDB Client", () => {
  let influxDBLogger: Logger;
  const mockConfig = {
    url: "http://localhost:8086",
    token: "test-token",
    org: "test-org",
    bucket: "test-bucket",
    measurement: "test_measurement",
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

    influxDBLogger = createInfluxDBLogger(mockConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const mockLog: Log = {
    timestamp: 1718901234,
    level: LogLevel.Info,
    serviceName: "notification-service",
    serviceVersion: "1.0.0",
    trigger: TriggerType.Manual,
    environment: EnvironmentType.Development,
    eventType: EventType.Command,
    host: "localhost",
    id: "12345",
    message: "Test message",
    durationMs: 150,
    traceId: "test-trace-id",
    spanId: "test-span-id",
    details: JSON.stringify({ test: "value" }),
    error: undefined,
  };

  it("should create a Point with correct measurement and timestamp", async () => {
    await influxDBLogger.writeLog(mockLog);

    expect(mockPointInstance.measurement).toHaveBeenCalledWith(
      mockConfig.measurement,
    );
    expect(mockPointInstance.timestamp).toHaveBeenCalledWith(
      mockLog.timestamp * 1_000_000,
    );
  });

  it("should add all tags to the Point", async () => {
    await influxDBLogger.writeLog(mockLog);

    expect(mockPointInstance.tag).toHaveBeenCalledWith("level", mockLog.level);
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "service_name",
      mockLog.serviceName,
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "service_version",
      mockLog.serviceVersion,
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "trigger",
      mockLog.trigger,
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "environment",
      mockLog.environment,
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith(
      "event_type",
      mockLog.eventType,
    );
    expect(mockPointInstance.tag).toHaveBeenCalledWith("host", mockLog.host);
  });

  it("should add all fields to the Point", async () => {
    await influxDBLogger.writeLog(mockLog);

    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "id",
      mockLog.id,
    );
    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "message",
      mockLog.message,
    );
    expect(mockPointInstance.floatField).toHaveBeenCalledWith(
      "duration_ms",
      mockLog.durationMs,
    );
    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "trace_id",
      mockLog.traceId,
    );
    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "span_id",
      mockLog.spanId,
    );
    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "details",
      mockLog.details,
    );
  });

  it("should handle error field when present", async () => {
    const logWithError: Log = {
      ...mockLog,
      error: "Test error message",
    };

    await influxDBLogger.writeLog(logWithError);

    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "error",
      "Test error message",
    );
  });

  it("should call writePoint and close on WriteAPI", async () => {
    await influxDBLogger.writeLog(mockLog);

    expect(mockWriteApi.writePoint).toHaveBeenCalled();
    expect(mockWriteApi.close).toHaveBeenCalled();
  });

  it("should not throw error when optional fields are missing", async () => {
    const logWithoutOptionalFields: Log = {
      timestamp: 1718901234,
      level: LogLevel.Debug,
      serviceName: "notification-service",
      serviceVersion: "1.0.0",
      trigger: TriggerType.Manual,
      environment: EnvironmentType.Development,
      eventType: EventType.Command,
      host: "localhost",
      id: "12345",
      message: "Test message",
      durationMs: 150,
    };

    await expect(
      influxDBLogger.writeLog(logWithoutOptionalFields),
    ).resolves.not.toThrow();

    expect(mockPointInstance.timestamp).toHaveBeenCalledWith(
      1718901234 * 1_000_000,
    );
  });

  it("should handle numeric details correctly", async () => {
    const logWithNumericDetails: Log = {
      ...mockLog,
      details: "42",
    };

    await influxDBLogger.writeLog(logWithNumericDetails);

    expect(mockPointInstance.stringField).toHaveBeenCalledWith("details", "42");
  });

  it("should handle boolean details correctly", async () => {
    const logWithBooleanDetails: Log = {
      ...mockLog,
      details: "true",
    };

    await influxDBLogger.writeLog(logWithBooleanDetails);

    expect(mockPointInstance.stringField).toHaveBeenCalledWith(
      "details",
      "true",
    );
  });

  it("should not add undefined fields", async () => {
    const logWithUndefinedFields: Log = {
      ...mockLog,
      traceId: undefined,
      spanId: undefined,
      details: undefined,
      error: undefined,
    };

    await influxDBLogger.writeLog(logWithUndefinedFields);

    const stringFieldCalls = mockPointInstance.stringField.mock.calls;
    const fieldNames = stringFieldCalls.map((call) => call[0]);

    expect(fieldNames).toContain("id");
    expect(fieldNames).toContain("message");
    expect(fieldNames).not.toContain("trace_id");
    expect(fieldNames).not.toContain("span_id");
    expect(fieldNames).not.toContain("details");
    expect(fieldNames).not.toContain("error");
  });

  it("should multiply timestamp by 1000000 correctly", async () => {
    const testTimestamp = 1234567890;
    const logWithSpecificTimestamp: Log = {
      ...mockLog,
      timestamp: testTimestamp,
    };

    await influxDBLogger.writeLog(logWithSpecificTimestamp);

    expect(mockPointInstance.timestamp).toHaveBeenCalledWith(
      testTimestamp * 1_000_000,
    );
  });
});
