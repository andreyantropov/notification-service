import { writeLog } from "./influxdb";
import { LogLevel } from "../../enum/LogLevel";
import { TriggerType } from "../../enum/TriggerType";

jest.mock("@influxdata/influxdb-client", () => {
  const mockPoint = {
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

  return {
    InfluxDB: jest.fn(() => ({
      getWriteApi: jest.fn(() => mockWriteApi),
    })),
    Point: jest.fn(() => mockPoint),
  };
});

describe("writeLog", () => {
  const mockLog = {
    measurement: "test_measurement",
    timestamp: Date.now(),
    tags: {
      level: LogLevel.Info,
      currentService: "service_a",
      trigger: TriggerType.Cron,
    },
    fields: {
      id: "12345",
      message: "Test message",
      durationMs: 150,
    },
  };

  it("should create a Point with correct measurement and timestamp", async () => {
    await writeLog(mockLog);

    const PointMock = require("@influxdata/influxdb-client").Point;
    const pointInstance = PointMock.mock.results[0].value;

    expect(pointInstance.measurement).toHaveBeenCalledWith("test_measurement");
    expect(pointInstance.timestamp).toHaveBeenCalledWith(mockLog.timestamp);
  });

  it("should add tags to the Point", async () => {
    await writeLog(mockLog);

    const PointMock = require("@influxdata/influxdb-client").Point;
    const pointInstance = PointMock.mock.results[0].value;

    expect(pointInstance.tag).toHaveBeenCalledWith("level", LogLevel.Info);
    expect(pointInstance.tag).toHaveBeenCalledWith(
      "current_service",
      "service_a",
    );
    expect(pointInstance.tag).toHaveBeenCalledWith("trigger", TriggerType.Cron);
  });

  it("should add fields to the Point", async () => {
    await writeLog(mockLog);

    const PointMock = require("@influxdata/influxdb-client").Point;
    const pointInstance = PointMock.mock.results[0].value;

    expect(pointInstance.stringField).toHaveBeenCalledWith("id", "12345");
    expect(pointInstance.stringField).toHaveBeenCalledWith(
      "message",
      "Test message",
    );
    expect(pointInstance.floatField).toHaveBeenCalledWith("duration_ms", 150);
  });

  it("should call writePoint and close on the WriteApi", async () => {
    await writeLog(mockLog);

    const InfluxDBMock = require("@influxdata/influxdb-client").InfluxDB;
    const influxDBInstance = new InfluxDBMock();
    const getWriteApiMock = influxDBInstance.getWriteApi();

    expect(getWriteApiMock.writePoint).toHaveBeenCalled();
    expect(getWriteApiMock.close).toHaveBeenCalled();
  });
});
