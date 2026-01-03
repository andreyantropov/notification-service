import { describe, it, expect, beforeEach, vi } from 'vitest';
import { metrics } from '@opentelemetry/api';
import type { Meter, Counter, Histogram } from '@opentelemetry/api';

import { createMeter } from './createMeter.js';
import type { MeterConfig } from './interfaces/index.js';

vi.mock('@opentelemetry/api', () => {
  const mockCounter = {
    add: vi.fn(),
  };
  const mockHistogram = {
    record: vi.fn(),
  };
  const mockMeter = {
    createCounter: vi.fn().mockReturnValue(mockCounter),
    createHistogram: vi.fn().mockReturnValue(mockHistogram),
  };
  const mockMetrics = {
    getMeter: vi.fn().mockReturnValue(mockMeter),
  };

  return {
    metrics: mockMetrics,
    Counter: undefined,
    Histogram: undefined,
  };
});

describe('createMeter', () => {
  let config: MeterConfig;
  let mockOtelMeter: Meter;
  let mockCounter: Counter;
  let mockHistogram: Histogram;

  beforeEach(() => {
    vi.clearAllMocks();

    config = { serviceName: 'test-service' };

    mockOtelMeter = (metrics.getMeter as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    mockCounter = (mockOtelMeter.createCounter as ReturnType<typeof vi.fn>).mock.results[0]?.value;
    mockHistogram = (mockOtelMeter.createHistogram as ReturnType<typeof vi.fn>).mock.results[0]?.value;
  });

  it('creates OpenTelemetry meter with correct service name', () => {
    createMeter(config);
    expect(metrics.getMeter).toHaveBeenCalledWith('test-service');
  });

  it('increments a counter with snake_case labels', () => {
    const meter = createMeter(config);
    const labels = { myLabel: 'value', anotherLabel: 'test' };

    meter.increment('test_counter', labels);

    expect(mockOtelMeter.createCounter).toHaveBeenCalledWith('test_counter');
    expect(mockCounter.add).toHaveBeenCalledWith(1, {
      my_label: 'value',
      another_label: 'test',
    });
  });

  it('increments a counter without labels', () => {
    const meter = createMeter(config);
    meter.increment('test_counter');

    expect(mockCounter.add).toHaveBeenCalledWith(1, undefined);
  });

  it('records a histogram value with snake_case labels', () => {
    const meter = createMeter(config);
    const labels = { latencyType: 'p99', region: 'us-east' };

    meter.record('http_request_duration_ms', 150, labels);

    expect(mockOtelMeter.createHistogram).toHaveBeenCalledWith('http_request_duration_ms');
    expect(mockHistogram.record).toHaveBeenCalledWith(150, {
      latency_type: 'p99',
      region: 'us-east',
    });
  });

  it('records a histogram value without labels', () => {
    const meter = createMeter(config);
    meter.record('http_request_duration_ms', 200);

    expect(mockHistogram.record).toHaveBeenCalledWith(200, undefined);
  });

  it('reuses the same counter for repeated metric names', () => {
    const meter = createMeter(config);

    meter.increment('reused_counter', { a: '1' });
    meter.increment('reused_counter', { b: '2' });

    expect(mockOtelMeter.createCounter).toHaveBeenCalledTimes(1);
    expect(mockCounter.add).toHaveBeenCalledTimes(2);
  });

  it('reuses the same histogram for repeated metric names', () => {
    const meter = createMeter(config);

    meter.record('reused_histogram', 100, { a: '1' });
    meter.record('reused_histogram', 200, { b: '2' });

    expect(mockOtelMeter.createHistogram).toHaveBeenCalledTimes(1);
    expect(mockHistogram.record).toHaveBeenCalledTimes(2);
  });
});