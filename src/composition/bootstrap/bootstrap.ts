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

export const bootstrap = async (): Promise<void> => {
  let loggerAdapter: LoggerAdapter | undefined;

  try {
    propagation.setGlobalPropagator(new W3CTraceContextPropagator());
    const otelSdk = new NodeSDK({
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
      ],
    });
    otelSdk.start();

    loggerAdapter = container.resolve<LoggerAdapter>("loggerAdapter");
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

    const shutdown = async () => {
      try {
        sendNotificationProcess.stop();
        await server.stop();

        await loggerAdapter?.debug({
          message: "Приложение корректно завершило работу",
          eventType: EventType.Shutdown,
        });

        if (otelSdk) {
          await otelSdk.shutdown();
        }
      } catch (error) {
        console.error("Ошибка при завершении работы:", error);
      } finally {
        process.exit(0);
      }
    };

    const SHUTDOWN_SIGNALS = ["SIGTERM", "SIGINT", "SIGQUIT"] as const;
    SHUTDOWN_SIGNALS.forEach((signal) => {
      process.on(signal, () => {
        SHUTDOWN_SIGNALS.forEach((s) => process.removeAllListeners(s));
        shutdown();
      });
    });
  } catch (error) {
    if (loggerAdapter) {
      await loggerAdapter.critical({
        message: "Критическая ошибка при запуске приложения",
        eventType: EventType.Bootstrap,
        error: error,
      });
    } else {
      console.error("Критическая ошибка при запуске приложения", error);
    }

    process.exit(1);
  }
};
