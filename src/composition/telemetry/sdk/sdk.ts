import os from "os";

import { propagation } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchLogRecordProcessor,
  ConsoleLogRecordExporter,
} from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  ATTR_SERVER_ADDRESS,
  ATTR_SERVER_PORT,
} from "@opentelemetry/semantic-conventions";

import { EnvironmentType } from "../../../application/enums/index.js";
import { telemetryConfig } from "../../../configs/telemetryConfig.js";

let instance: NodeSDK | null = null;
let isStarting = false;
let isShuttingDown = false;

const {
  serviceName,
  serviceVersion,
  environment,
  port,
  otelTracesUrl,
  otelLogsUrl,
} = telemetryConfig;

propagation.setGlobalPropagator(new W3CTraceContextPropagator());

const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: serviceVersion,
  [ATTR_SERVER_ADDRESS]: os.hostname(),
  [ATTR_SERVER_PORT]: port,
  "deployment.environment": environment,
});

const traceExporter =
  environment === EnvironmentType.Development
    ? new ConsoleSpanExporter()
    : new OTLPTraceExporter({ url: otelTracesUrl });
const spanProcessor = new BatchSpanProcessor(traceExporter);

const logExporter =
  environment === EnvironmentType.Development
    ? new ConsoleLogRecordExporter()
    : new OTLPLogExporter({ url: otelLogsUrl });
const logRecordProcessor = new BatchLogRecordProcessor(logExporter);

instance = new NodeSDK({
  resource,
  spanProcessor,
  logRecordProcessor,
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});

const start = () => {
  if (isStarting || isShuttingDown) {
    return;
  }

  isStarting = true;
  instance.start();
  isStarting = false;
};

const shutdown = async () => {
  if (isStarting || isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  await instance.shutdown();
  isShuttingDown = false;
};

export { start, shutdown };
