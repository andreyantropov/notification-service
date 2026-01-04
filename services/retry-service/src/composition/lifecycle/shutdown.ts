/* eslint-disable import/order */
import { telemetry } from "../telemetry/index.js";
import { container } from "../container/index.js";

export const shutdown = async () => {
  const server = container.resolve("server");
  await server.shutdown();

  const retryConsumer = container.resolve("retryConsumer");
  await retryConsumer.shutdown();

  telemetry.shutdown();
};
