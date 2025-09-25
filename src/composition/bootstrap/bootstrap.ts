import { propagation } from "@opentelemetry/api";
import { W3CTraceContextPropagator } from "@opentelemetry/core";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { NodeSDK } from "@opentelemetry/sdk-node";

import { SendNotificationProcess } from "../../application/jobs/createSendNotificationProcess/index.js";
import { LoggerAdapter } from "../../application/ports/LoggerAdapter.js";
import { Server } from "../../infrastructure/ports/Server.js";
import { EventType } from "../../shared/enums/EventType.js";
import { container } from "../container/index.js";

const initOpenTelemetry = (): NodeSDK => {
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
  const sdk = new NodeSDK({
    instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
  });
  sdk.start();
  return sdk;
};

const startApplication = async (loggerAdapter: LoggerAdapter) => {
  const sendNotificationProcess = container.resolve<SendNotificationProcess>(
    "sendNotificationProcess",
  );
  const server = container.resolve<Server>("server");

  sendNotificationProcess.start();
  server.start();

  await loggerAdapter.debug({
    message: "Приложение успешно запущено",
    eventType: EventType.Bootstrap,
  });

  return { sendNotificationProcess, server };
};

const setupGracefulShutdown = (
  loggerAdapter: LoggerAdapter,
  otelSdk: NodeSDK,
  sendNotificationProcess: SendNotificationProcess,
  server: Server,
) => {
  const shutdown = async () => {
    try {
      sendNotificationProcess.stop();
      await server.stop();

      await loggerAdapter.debug({
        message: "Приложение корректно завершило работу",
        eventType: EventType.Shutdown,
      });

      await otelSdk.shutdown();
    } catch (error) {
      await loggerAdapter.error({
        message: "Ошибка при завершении работы",
        eventType: EventType.Shutdown,
        error,
      });
    } finally {
      process.exit(0);
    }
  };

  const SHUTDOWN_SIGNALS = ["SIGTERM", "SIGINT", "SIGQUIT"] as const;
  SHUTDOWN_SIGNALS.forEach((signal) => {
    process.on(signal, () => {
      SHUTDOWN_SIGNALS.forEach((s) => process.removeAllListeners(s));
      void shutdown();
    });
  });
};

export const bootstrap = async (): Promise<void> => {
  let loggerAdapter: LoggerAdapter | undefined;
  let otelSdk: NodeSDK | undefined;

  try {
    otelSdk = initOpenTelemetry();
    loggerAdapter = container.resolve<LoggerAdapter>("loggerAdapter");

    const { sendNotificationProcess, server } =
      await startApplication(loggerAdapter);
    setupGracefulShutdown(
      loggerAdapter,
      otelSdk,
      sendNotificationProcess,
      server,
    );
  } catch (error) {
    if (loggerAdapter) {
      await loggerAdapter.critical({
        message: "Критическая ошибка при запуске приложения",
        eventType: EventType.Bootstrap,
        error,
      });
    } else {
      console.error("Критическая ошибка при запуске приложения", error);
    }
    process.exit(1);
  }
};
