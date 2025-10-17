/* eslint-disable import/order */
import { EventType } from "../../infrastructure/telemetry/logging/enums/EventType.js";
import { start as startTelemetry } from "../telemetry/telemetry.js";
import { container } from "../container/container.js";

export const start = async () => {
  startTelemetry();

  const taskManager = container.resolve("taskManager");
  taskManager.start();

  const server = container.resolve("server");
  await server.start();

  const logger = container.resolve("logger");
  logger.debug({
    message: "Приложение успешно запущено",
    eventType: EventType.Bootstrap,
  });
};
