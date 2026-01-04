/* eslint-disable import/order */
import { telemetry } from "../telemetry/index.js";
import { container } from "../container/index.js";

export const start = async () => {
  telemetry.start();

  const producer = container.resolve("producer");
  await producer.start();

  const batchConsumer = container.resolve("batchConsumer");
  await batchConsumer.start();

  const server = container.resolve("server");
  await server.start();
};
