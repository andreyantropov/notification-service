import type { Counter, Histogram } from "@opentelemetry/api";
import { metrics } from "@opentelemetry/api";

import type { MeterConfig } from "./interfaces/index.js";
import type { Meter } from "../../../application/ports/index.js";
import { mapKeysToSnakeCase } from "../../../shared/utils/index.js";

export const createMeter = (config: MeterConfig): Meter => {
  const { serviceName } = config;
  const otelMeter = metrics.getMeter(serviceName);

  const counters = new Map<string, Counter>();
  const histograms = new Map<string, Histogram>();

  const getOrCreateCounter = (name: string): Counter => {
    if (!counters.has(name)) {
      const counter = otelMeter.createCounter(name);
      counters.set(name, counter);
    }
    return counters.get(name)!;
  };

  const getOrCreateHistogram = (name: string): Histogram => {
    if (!histograms.has(name)) {
      const histogram = otelMeter.createHistogram(name);
      histograms.set(name, histogram);
    }
    return histograms.get(name)!;
  };

  const increment = (name: string, labels?: Record<string, string>): void => {
    const counter = getOrCreateCounter(name);
    counter.add(1, mapKeysToSnakeCase(labels));
  };

  const record = (name: string, value: number, labels?: Record<string, string>): void => {
    const histogram = getOrCreateHistogram(name);
    histogram.record(value, mapKeysToSnakeCase(labels));
  };

  return {
    increment,
    record,
  };
};
