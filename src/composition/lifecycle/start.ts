/* eslint-disable import/order */
import { start as startSDK } from "../telemetry/sdk/index.js";
import { container } from "../container/container.js";

export const start = async () => {
  startSDK();

  const producer = container.resolve("producer");
  await producer.start();

  const batchConsumer = container.resolve("batchConsumer");
  await batchConsumer.start();

  const retryConsumer = container.resolve("retryConsumer");
  await retryConsumer.start();

  const server = container.resolve("server");
  await server.start();
};
