/* eslint-disable import/order */
import { EventType } from "../../infrastructure/telemetry/logging/enums/EventType.js";
import { shutdown as shutdownTelemetry } from "../telemetry/telemetry.js";
import { container } from "../container/container.js";

export const shutdown = async () => {
  const logger = container.resolve("logger");
  logger.debug({
    message: "Приложение корректно завершило работу",
    eventType: EventType.Shutdown,
  });

  const server = container.resolve("server");
  await server.shutdown();

  const retryConsumer = container.resolve("retryConsumer");
  await retryConsumer.shutdown();

  const batchConsumer = container.resolve("batchConsumer");
  await batchConsumer.shutdown();

  const producer = container.resolve("producer");
  await producer.shutdown();

  await shutdownTelemetry();
};
