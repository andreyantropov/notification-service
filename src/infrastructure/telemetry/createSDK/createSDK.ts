import os from "os";

import { propagation } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter,
} from "@opentelemetry/sdk-logs";
import {
  ConsoleMetricExporter,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import {
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

import { CustomLogProcessor } from "./entities/CustomProcessor/index.js";
import { type SDK, type SDKConfig } from "./interfaces/index.js";

export const createSDK = (config: SDKConfig): SDK => {
  let isStarting = false;
  let isShuttingDown = false;

  const {
    name,
    version,
    environment,
    port,
    exporters: { tracesExporterUrl, logsExporterUrl, metricsExporterUrl },
  } = config;

  propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: name,
    [ATTR_SERVICE_VERSION]: version,
    [ATTR_SERVER_ADDRESS]: os.hostname(),
    [ATTR_SERVER_PORT]: port,
    "deployment.environment": environment,
  });

  const traceExporter = tracesExporterUrl
    ? new OTLPTraceExporter({ url: tracesExporterUrl })
    : new ConsoleSpanExporter();
  const spanProcessor = new BatchSpanProcessor(traceExporter);

  const logExporter = logsExporterUrl
    ? new OTLPLogExporter({ url: logsExporterUrl })
    : new ConsoleLogRecordExporter();
  const customProcessor = new CustomLogProcessor();
  const logRecordProcessor = new BatchLogRecordProcessor(logExporter);

  const metricExporter = metricsExporterUrl
    ? new OTLPMetricExporter({ url: metricsExporterUrl })
    : new ConsoleMetricExporter();

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
  });

  const sdk = new NodeSDK({
    resource,
    spanProcessor,
    logRecordProcessor: {
      onEmit: (log) => {
        customProcessor.onEmit(log);
        logRecordProcessor.onEmit(log);
      },
      shutdown: () => logRecordProcessor.shutdown(),
      forceFlush: () => logRecordProcessor.forceFlush(),
    },
    metricReader,
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  });

  const start = async (): Promise<void> => {
    if (isStarting || isShuttingDown) {
      return;
    }

    isStarting = true;
    sdk.start();
    isStarting = false;
  };

  const shutdown = async (): Promise<void> => {
    if (isStarting || isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    await sdk.shutdown();
    isShuttingDown = false;
  };

  return {
    start,
    shutdown,
  };
};
