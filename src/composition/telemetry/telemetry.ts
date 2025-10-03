import { propagation } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { ConsoleSpanExporter } from "@opentelemetry/sdk-trace-base";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

import { loggerAdapterConfig } from "../../configs/index.js";

let instance: NodeSDK | null = null;

if (instance === null) {
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());

  instance = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: loggerAdapterConfig.serviceName,
      [ATTR_SERVICE_VERSION]: loggerAdapterConfig.serviceVersion,
    }),
    traceExporter: new ConsoleSpanExporter(),
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  });
}

const start = () => {
  if (instance !== null) {
    instance.start();
  }
};

const shutdown = async () => {
  if (instance) {
    await instance.shutdown();
    instance = null;
  }
};

export { start, shutdown };
