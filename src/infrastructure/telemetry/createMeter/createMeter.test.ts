import {
  type Counter,
  type Gauge,
  type Histogram,
  metrics,
  type Meter as OtelMeter,
} from "@opentelemetry/api";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { mapKeysToSnakeCase } from "../utils/index.js";

import { createMeter } from "./createMeter.js";
import { type MeterConfig } from "./interfaces/index.js";

vi.mock("@opentelemetry/api");
vi.mock("../utils/index.js");

const mockMapKeysToSnakeCase = vi.mocked(mapKeysToSnakeCase);
const mockMetrics = vi.mocked(metrics);

describe("createMeter", () => {
  const mockServiceName = "test-service";
  const mockConfig: MeterConfig = {
    serviceName: mockServiceName,
  };

  const mockCounter = {
    add: vi.fn(),
  } as unknown as Counter;

  const mockHistogram = {
    record: vi.fn(),
  } as unknown as Histogram;

  const mockGauge = {
    record: vi.fn(),
  } as unknown as Gauge;

  const mockOtelMeter = {
    createCounter: vi.fn().mockReturnValue(mockCounter),
    createHistogram: vi.fn().mockReturnValue(mockHistogram),
    createGauge: vi.fn().mockReturnValue(mockGauge),
  } as unknown as OtelMeter;

  beforeEach(() => {
    vi.clearAllMocks();
    mockMetrics.getMeter.mockReturnValue(mockOtelMeter);
    mockMapKeysToSnakeCase.mockReturnValue({});
  });

  describe("Metric Creation", () => {
    it("should initialize Otel Meter with service name", () => {
      createMeter(mockConfig);
      expect(mockMetrics.getMeter).toHaveBeenCalledWith(mockServiceName);
    });

    it("should create metrics with raw names (no prefix)", () => {
      const meter = createMeter(mockConfig);

      meter.increment("hits");
      meter.record("latency", 100);
      meter.gauge("memory", 512);

      expect(mockOtelMeter.createCounter).toHaveBeenCalledWith("hits");
      expect(mockOtelMeter.createHistogram).toHaveBeenCalledWith("latency");
      expect(mockOtelMeter.createGauge).toHaveBeenCalledWith("memory");
    });
  });

  describe("increment", () => {
    it("should reuse existing counter for the same name", () => {
      const meter = createMeter(mockConfig);
      const name = "test_counter";

      meter.increment(name);
      meter.increment(name);

      expect(mockOtelMeter.createCounter).toHaveBeenCalledTimes(1);
    });

    it("should call add with 1 and snake_cased labels", () => {
      const meter = createMeter(mockConfig);
      const labels = { userId: "42" };
      const transformed = { user_id: "42" };

      mockMapKeysToSnakeCase.mockReturnValue(transformed);

      meter.increment("test", labels);

      expect(mockMapKeysToSnakeCase).toHaveBeenCalledWith(labels);
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformed);
    });
  });

  describe("add", () => {
    it("should add a specific value to the counter", () => {
      const meter = createMeter(mockConfig);
      const value = 1024;

      meter.add("bytes_processed", value);

      expect(mockOtelMeter.createCounter).toHaveBeenCalledWith(
        "bytes_processed",
      );
      expect(mockCounter.add).toHaveBeenCalledWith(value, expect.any(Object));
    });

    it("should reuse counter from increment", () => {
      const meter = createMeter(mockConfig);
      const name = "mixed_counter";

      meter.increment(name);
      meter.add(name, 5);

      expect(mockOtelMeter.createCounter).toHaveBeenCalledTimes(1);
    });
  });

  describe("record", () => {
    it("should create histogram and record value", () => {
      const meter = createMeter(mockConfig);
      const value = 150.5;

      meter.record("latency", value);

      expect(mockOtelMeter.createHistogram).toHaveBeenCalledWith("latency");
      expect(mockHistogram.record).toHaveBeenCalledWith(
        value,
        expect.any(Object),
      );
    });
  });

  describe("gauge", () => {
    it("should create gauge and record current value", () => {
      const meter = createMeter(mockConfig);
      const value = 80;

      meter.gauge("cpu_usage", value);

      expect(mockOtelMeter.createGauge).toHaveBeenCalledWith("cpu_usage");
      expect(mockGauge.record).toHaveBeenCalledWith(value, expect.any(Object));
    });

    it("should reuse existing gauge for the same name", () => {
      const meter = createMeter(mockConfig);

      meter.gauge("temp", 36.6);
      meter.gauge("temp", 37.0);

      expect(mockOtelMeter.createGauge).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cache isolation", () => {
    it("should maintain separate caches for different metric types with same names", () => {
      const meter = createMeter(mockConfig);
      const commonName = "shared_name";

      meter.increment(commonName);
      meter.record(commonName, 1);
      meter.gauge(commonName, 100);

      expect(mockOtelMeter.createCounter).toHaveBeenCalledWith(commonName);
      expect(mockOtelMeter.createHistogram).toHaveBeenCalledWith(commonName);
      expect(mockOtelMeter.createGauge).toHaveBeenCalledWith(commonName);

      expect(mockOtelMeter.createCounter).toHaveBeenCalledTimes(1);
      expect(mockOtelMeter.createHistogram).toHaveBeenCalledTimes(1);
      expect(mockOtelMeter.createGauge).toHaveBeenCalledTimes(1);
    });
  });

  describe("Label values", () => {
    it("should handle string, numeric and boolean values in labels", () => {
      const meter = createMeter(mockConfig);
      const labels = {
        userId: "42",
        retryCount: 3,
        isActive: true,
      };
      const transformed = {
        user_id: "42",
        retry_count: 3,
        is_active: true,
      };

      mockMapKeysToSnakeCase.mockReturnValue(transformed);

      meter.increment("test", labels);

      expect(mockMapKeysToSnakeCase).toHaveBeenCalledWith(labels);
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformed);
    });
  });
});
