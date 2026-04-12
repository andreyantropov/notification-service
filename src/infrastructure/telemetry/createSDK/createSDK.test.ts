import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSDK } from "./createSDK.js";
import { type SDKConfig } from "./interfaces/index.js";

vi.mock("@opentelemetry/sdk-node");
vi.mock("@opentelemetry/exporter-trace-otlp-http");
vi.mock("@opentelemetry/exporter-logs-otlp-http");
vi.mock("@opentelemetry/exporter-metrics-otlp-http");
vi.mock("@opentelemetry/api", () => ({
  propagation: {
    setGlobalPropagator: vi.fn(),
  },
}));

describe("createSDK", () => {
  const defaultConfig: SDKConfig = {
    name: "test-service",
    version: "1.0.0",
    environment: "test",
    port: 3000,
    exporters: {
      tracesExporterUrl: "http://traces",
      logsExporterUrl: "http://logs",
      metricsExporterUrl: "http://metrics",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize NodeSDK with OTLP exporters when URLs are provided", () => {
    createSDK(defaultConfig);

    expect(OTLPTraceExporter).toHaveBeenCalledWith({
      url: defaultConfig.exporters.tracesExporterUrl,
    });
    expect(NodeSDK).toHaveBeenCalled();
  });

  it("should use Console exporters when URLs are missing", () => {
    const configWithoutUrls: SDKConfig = {
      ...defaultConfig,
      exporters: {
        tracesExporterUrl: undefined as unknown as string,
        logsExporterUrl: undefined as unknown as string,
        metricsExporterUrl: undefined as unknown as string,
      },
    };

    createSDK(configWithoutUrls);

    expect(NodeSDK).toHaveBeenCalled();
    expect(OTLPTraceExporter).not.toHaveBeenCalled();
  });

  it("should prevent concurrent shutdown operations", async () => {
    const sdkInstance = {
      start: vi.fn(),
      shutdown: vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 50)),
        ),
    };
    vi.mocked(NodeSDK).mockImplementation(
      () => sdkInstance as unknown as NodeSDK,
    );

    const sdk = createSDK(defaultConfig);

    const firstShutdown = sdk.shutdown();
    const secondShutdown = sdk.shutdown();

    await Promise.all([firstShutdown, secondShutdown]);

    expect(sdkInstance.shutdown).toHaveBeenCalledTimes(1);
  });

  it("should call sdk.shutdown() correctly", async () => {
    const sdkInstance = {
      start: vi.fn(),
      shutdown: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(NodeSDK).mockImplementation(
      () => sdkInstance as unknown as NodeSDK,
    );

    const sdk = createSDK(defaultConfig);
    await sdk.shutdown();

    expect(sdkInstance.shutdown).toHaveBeenCalledTimes(1);
  });

  it("should prevent concurrent start/shutdown operations", async () => {
    const sdkInstance = {
      start: vi.fn(),
      shutdown: vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 10)),
        ),
    };
    vi.mocked(NodeSDK).mockImplementation(
      () => sdkInstance as unknown as NodeSDK,
    );

    const sdk = createSDK(defaultConfig);

    const firstShutdown = sdk.shutdown();
    const secondShutdown = sdk.shutdown();

    await Promise.all([firstShutdown, secondShutdown]);

    expect(sdkInstance.shutdown).toHaveBeenCalledTimes(1);
  });
});
