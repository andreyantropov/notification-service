import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { metrics } from '@opentelemetry/api';

import { createMeter } from './createMeter.js';
import type { MeterConfig } from './interfaces/index.js';
import { mapKeysToSnakeCase } from '../../../shared/utils/index.js';

vi.mock('@opentelemetry/api');
vi.mock('../../../shared/utils/index.js');

const mockMapKeysToSnakeCase = vi.mocked(mapKeysToSnakeCase);
const mockMetrics = vi.mocked(metrics);

describe('createMeter', () => {
  const mockServiceName = 'test-service';
  const mockConfig: MeterConfig = { serviceName: mockServiceName };

  let mockOtelMeter: {
    createCounter: Mock;
    createHistogram: Mock;
  };
  let mockCounter: {
    add: Mock;
  };
  let mockHistogram: {
    record: Mock;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockCounter = {
      add: vi.fn(),
    };

    mockHistogram = {
      record: vi.fn(),
    };

    mockOtelMeter = {
      createCounter: vi.fn().mockReturnValue(mockCounter),
      createHistogram: vi.fn().mockReturnValue(mockHistogram),
    };

    mockMetrics.getMeter = vi.fn().mockReturnValue(mockOtelMeter);

    mockMapKeysToSnakeCase.mockReturnValue(undefined);
  });

  it('should create a meter with increment and record methods', () => {
    const meter = createMeter(mockConfig);

    expect(typeof meter.increment).toBe('function');
    expect(typeof meter.record).toBe('function');
  });

  it('should get OpenTelemetry meter with service name', () => {
    createMeter(mockConfig);

    expect(mockMetrics.getMeter).toHaveBeenCalledTimes(1);
    expect(mockMetrics.getMeter).toHaveBeenCalledWith(mockServiceName);
  });

  describe('increment', () => {
    it('should create counter on first call and reuse on subsequent calls', () => {
      const meter = createMeter(mockConfig);
      const counterName = 'test_counter';

      meter.increment(counterName);
      expect(mockOtelMeter.createCounter).toHaveBeenCalledTimes(1);
      expect(mockOtelMeter.createCounter).toHaveBeenCalledWith(counterName);

      meter.increment(counterName);
      expect(mockOtelMeter.createCounter).toHaveBeenCalledTimes(1);
    });

    it('should increment counter by 1 without labels', () => {
      const meter = createMeter(mockConfig);
      const counterName = 'test_counter';

      meter.increment(counterName);

      expect(mockCounter.add).toHaveBeenCalledTimes(1);
      expect(mockCounter.add).toHaveBeenCalledWith(1, undefined);
    });

    it('should increment counter by 1 with transformed labels', () => {
      const meter = createMeter(mockConfig);
      const counterName = 'test_counter';
      const labels = { testLabel: 'value', anotherLabel: 'value2' };
      const transformedLabels = { test_label: 'value', another_label: 'value2' };

      mockMapKeysToSnakeCase.mockReturnValue(transformedLabels);

      meter.increment(counterName, labels);

      expect(mockMapKeysToSnakeCase).toHaveBeenCalledWith(labels);
      expect(mockCounter.add).toHaveBeenCalledTimes(1);
      expect(mockCounter.add).toHaveBeenCalledWith(1, transformedLabels);
    });

    it('should handle different counter names separately', () => {
      const meter = createMeter(mockConfig);

      meter.increment('counter1');
      meter.increment('counter2');

      expect(mockOtelMeter.createCounter).toHaveBeenCalledTimes(2);
      expect(mockOtelMeter.createCounter).toHaveBeenCalledWith('counter1');
      expect(mockOtelMeter.createCounter).toHaveBeenCalledWith('counter2');
    });
  });

  describe('record', () => {
    it('should create histogram on first call and reuse on subsequent calls', () => {
      const meter = createMeter(mockConfig);
      const histogramName = 'test_histogram';

      meter.record(histogramName, 42);
      expect(mockOtelMeter.createHistogram).toHaveBeenCalledTimes(1);
      expect(mockOtelMeter.createHistogram).toHaveBeenCalledWith(histogramName);

      meter.record(histogramName, 100);
      expect(mockOtelMeter.createHistogram).toHaveBeenCalledTimes(1);
    });

    it('should record value without labels', () => {
      mockMapKeysToSnakeCase.mockReturnValue(undefined);

      const meter = createMeter(mockConfig);
      const histogramName = 'test_histogram';
      const value = 42.5;

      meter.record(histogramName, value);

      expect(mockHistogram.record).toHaveBeenCalledTimes(1);
      expect(mockHistogram.record).toHaveBeenCalledWith(value, undefined);
    });

    it('should record value with transformed labels', () => {
      const meter = createMeter(mockConfig);
      const histogramName = 'test_histogram';
      const value = 100;
      const labels = { requestType: 'http', statusCode: '200' };
      const transformedLabels = { request_type: 'http', status_code: '200' };

      mockMapKeysToSnakeCase.mockReturnValue(transformedLabels);

      meter.record(histogramName, value, labels);

      expect(mockMapKeysToSnakeCase).toHaveBeenCalledWith(labels);
      expect(mockHistogram.record).toHaveBeenCalledTimes(1);
      expect(mockHistogram.record).toHaveBeenCalledWith(value, transformedLabels);
    });

    it('should handle different histogram names separately', () => {
      mockMapKeysToSnakeCase.mockReturnValue(undefined);

      const meter = createMeter(mockConfig);

      meter.record('histogram1', 10);
      meter.record('histogram2', 20);

      expect(mockOtelMeter.createHistogram).toHaveBeenCalledTimes(2);
      expect(mockOtelMeter.createHistogram).toHaveBeenCalledWith('histogram1');
      expect(mockOtelMeter.createHistogram).toHaveBeenCalledWith('histogram2');
    });

    it('should record zero value', () => {
      mockMapKeysToSnakeCase.mockReturnValue(undefined);

      const meter = createMeter(mockConfig);
      const histogramName = 'test_histogram';

      meter.record(histogramName, 0);

      expect(mockHistogram.record).toHaveBeenCalledTimes(1);
      expect(mockHistogram.record).toHaveBeenCalledWith(0, undefined);
    });

    it('should record negative value', () => {
      mockMapKeysToSnakeCase.mockReturnValue(undefined);

      const meter = createMeter(mockConfig);
      const histogramName = 'test_histogram';

      meter.record(histogramName, -5);

      expect(mockHistogram.record).toHaveBeenCalledTimes(1);
      expect(mockHistogram.record).toHaveBeenCalledWith(-5, undefined);
    });
  });

  it('should maintain separate caches for counters and histograms', () => {
    mockMapKeysToSnakeCase.mockReturnValue(undefined);

    const meter = createMeter(mockConfig);
    const name = 'same_name_but_different_type';

    meter.increment(name);
    expect(mockOtelMeter.createCounter).toHaveBeenCalledTimes(1);
    expect(mockOtelMeter.createHistogram).not.toHaveBeenCalled();

    meter.record(name, 42);
    expect(mockOtelMeter.createHistogram).toHaveBeenCalledTimes(1);
    expect(mockOtelMeter.createCounter).toHaveBeenCalledTimes(1);
  });

  it('should handle undefined labels in increment', () => {
    mockMapKeysToSnakeCase.mockReturnValue(undefined);

    const meter = createMeter(mockConfig);
    const counterName = 'test_counter';

    meter.increment(counterName, undefined);

    expect(mockMapKeysToSnakeCase).toHaveBeenCalledWith(undefined);
    expect(mockCounter.add).toHaveBeenCalledWith(1, undefined);
  });

  it('should handle undefined labels in record', () => {
    mockMapKeysToSnakeCase.mockReturnValue(undefined);

    const meter = createMeter(mockConfig);
    const histogramName = 'test_histogram';

    meter.record(histogramName, 42, undefined);

    expect(mockMapKeysToSnakeCase).toHaveBeenCalledWith(undefined);
    expect(mockHistogram.record).toHaveBeenCalledWith(42, undefined);
  });

  it('should handle empty labels object', () => {
    const meter = createMeter(mockConfig);
    const counterName = 'test_counter';
    const emptyLabels = {};

    mockMapKeysToSnakeCase.mockReturnValue(emptyLabels);

    meter.increment(counterName, emptyLabels);

    expect(mockMapKeysToSnakeCase).toHaveBeenCalledWith(emptyLabels);
    expect(mockCounter.add).toHaveBeenCalledWith(1, emptyLabels);
  });
});