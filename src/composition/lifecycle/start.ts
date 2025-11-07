/* eslint-disable import/order */
import { EventType } from "../../infrastructure/telemetry/logging/enums/EventType.js";
import { start as startTelemetry } from "../telemetry/telemetry.js";
import { container } from "../container/container.js";

export const start = async () => {
  await startTelemetry();

  const producer = container.resolve("producer");
  await producer.start();

  const batchConsumer = container.resolve("batchConsumer");
  await batchConsumer.start();

  const retryConsumer = container.resolve("retryConsumer");
  await retryConsumer.start();

  const server = container.resolve("server");
  await server.start();

  const logger = container.resolve("logger");
  logger.debug({
    message: "Приложение успешно запущено",
    eventType: EventType.Bootstrap,
  });
};
