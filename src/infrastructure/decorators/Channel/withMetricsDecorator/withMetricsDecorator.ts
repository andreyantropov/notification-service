import { type Channel } from "../../../../domain/ports/index.js";
import { type Contact } from "../../../../domain/types/index.js";

import { type MetricsDecoratorDependencies } from "./interfaces/index.js";

export const withMetricsDecorator = (
  dependencies: MetricsDecoratorDependencies,
): Channel => {
  const { channel, meter } = dependencies;

  const send = async (contact: Contact, message: string): Promise<void> => {
    const start = Date.now();
    let status = "success";

    try {
      await channel.send(contact, message);
    } catch (error) {
      status = "error";

      throw error;
    } finally {
      const durationMs = Date.now() - start;
      const labels = { status, channel: channel.type };

      meter.increment("notifications_sent_total", labels);
      meter.record("notifications_sent_duration_ms", durationMs, labels);
    }
  };

  return { ...channel, send };
};
