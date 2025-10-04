/* eslint-disable import/order */
import { EventType } from "../../shared/enums/EventType.js";
import { start as startTelemetry } from "../telemetry/telemetry.js";
import { container } from "../container/container.js";

export const start = async () => {
  startTelemetry();

  const sendNotificationProcess = container.resolve("sendNotificationProcess");
  sendNotificationProcess.start();

  const server = container.resolve("server");
  await server.start();

  const loggerAdapter = container.resolve("loggerAdapter");
  await loggerAdapter.debug({
    message: "Приложение успешно запущено",
    eventType: EventType.Bootstrap,
  });
};
