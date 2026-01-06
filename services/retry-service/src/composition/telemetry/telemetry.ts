import os from "os";

import { propagation } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
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
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
} from "@opentelemetry/semantic-conventions";

import type { Telemetry } from "./interfaces/index.js";
import { serviceConfig, telemetryConfig } from "../../configs/index.js";

let instance: NodeSDK | null = null;
let isStarting = false;
let isShuttingDown = false;

const { name, version, environment, port } = serviceConfig;
const { logsExporterUrl, metricsExporterUrl } = telemetryConfig;

propagation.setGlobalPropagator(new W3CTraceContextPropagator());

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: name,
  [ATTR_SERVICE_VERSION]: version,
  [ATTR_SERVER_ADDRESS]: os.hostname(),
  [ATTR_SERVER_PORT]: port,
  "deployment.environment": environment,
});

const logExporter = logsExporterUrl
  ? new OTLPLogExporter({ url: logsExporterUrl })
  : new ConsoleLogRecordExporter();
const logRecordProcessor = new BatchLogRecordProcessor(logExporter);

const metricExporter = metricsExporterUrl
  ? new OTLPMetricExporter({ url: metricsExporterUrl })
  : new ConsoleMetricExporter();
const metricReader = new PeriodicExportingMetricReader({
  exporter: metricExporter,
});

instance = new NodeSDK({
  resource,
  logRecordProcessor,
  metricReader,
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});

const start = () => {
  if (isStarting || isShuttingDown) return;
  isStarting = true;
  instance.start();
  isStarting = false;
};

const shutdown = async () => {
  if (isStarting || isShuttingDown) return;
  isShuttingDown = true;
  await instance.shutdown();
  isShuttingDown = false;
};

export const telemetry: Telemetry = { start, shutdown };