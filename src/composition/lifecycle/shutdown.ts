/* eslint-disable import/order */
import { EventType } from "../../shared/enums/EventType.js";
import { shutdown as shutdownTelemetry } from "../telemetry/telemetry.js";
import { container } from "../container/container.js";

export const shutdown = async () => {
  const server = container.resolve("server");
  await server.shutdown();

  const sendNotificationProcess = container.resolve("sendNotificationProcess");
  await sendNotificationProcess.shutdown();

  await shutdownTelemetry();

  const loggerAdapter = container.resolve("loggerAdapter");
  await loggerAdapter.debug({
    message: "Приложение корректно завершило работу",
    eventType: EventType.Shutdown,
  });
};
