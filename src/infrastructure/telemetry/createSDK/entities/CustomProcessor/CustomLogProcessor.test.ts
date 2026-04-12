import { type Attributes } from "@opentelemetry/api";
import { SeverityNumber } from "@opentelemetry/api-logs";
import { type SdkLogRecord } from "@opentelemetry/sdk-logs";
import { beforeEach, describe, expect, it } from "vitest";

import { LOG_LEVEL } from "../../../createLogger/index.js";

import { CustomLogProcessor } from "./CustomLogProcessor.js";

describe("CustomLogProcessor", () => {
  let processor: CustomLogProcessor;

  beforeEach(() => {
    processor = new CustomLogProcessor();
  });

  const createMockLogRecord = (
    overrides: Partial<SdkLogRecord> = {},
  ): SdkLogRecord => {
    return {
      attributes: {},
      severityText: undefined,
      severityNumber: undefined,
      eventName: undefined,
      ...overrides,
    } as SdkLogRecord;
  };

  it("should set SeverityNumber.FATAL when severityText is fatal", () => {
    const logRecord = createMockLogRecord({
      severityText: LOG_LEVEL.FATAL,
    });

    processor.onEmit(logRecord);

    expect(logRecord.severityNumber).toBe(SeverityNumber.FATAL);
    expect(logRecord.severityText).toBe(LOG_LEVEL.FATAL);
  });

  it("should set SeverityNumber.TRACE when level attribute is trace", () => {
    const logRecord = createMockLogRecord({
      attributes: { level: LOG_LEVEL.TRACE } as Attributes,
    });

    processor.onEmit(logRecord);

    expect(logRecord.severityNumber).toBe(SeverityNumber.TRACE);
    expect(logRecord.severityText).toBe(LOG_LEVEL.TRACE);
  });

  it("should move eventName from attributes to the root field", () => {
    const eventName = "test.event.received";
    const logRecord = createMockLogRecord({
      attributes: {
        eventName,
        other: "data",
      } as Attributes,
    });

    processor.onEmit(logRecord);

    expect(logRecord.eventName).toBe(eventName);
    expect(logRecord.attributes["eventName"]).toBeUndefined();
    expect(logRecord.attributes["other"]).toBe("data");
  });

  it("should not modify record if no custom logic matches", () => {
    const logRecord = createMockLogRecord({
      severityText: "info",
      severityNumber: SeverityNumber.INFO,
      attributes: { foo: "bar" } as Attributes,
    });

    processor.onEmit(logRecord);

    expect(logRecord.severityNumber).toBe(SeverityNumber.INFO);
    expect(logRecord.attributes["foo"]).toBe("bar");
    expect(logRecord.eventName).toBeUndefined();
  });
});
