import type { MeteredChannelDependencies } from "./interfaces/index.js";
import type { Channel } from "../../../../domain/ports/index.js";
import type { Contact } from "@notification-platform/shared";
import { CHANNEL_LATENCY_MS, NOTIFICATIONS_PROCESSED_BY_CHANNEL } from "./constants/index.js";

export const createMeteredChannel = (
  dependencies: MeteredChannelDependencies,
): Channel => {
  const { channel, meter } = dependencies;

  const send = async (contact: Contact, message: string): Promise<void> => {
    const start = Date.now();
    try {
      await channel.send(contact, message);
      const durationMs = Date.now() - start;

      meter.record(CHANNEL_LATENCY_MS, durationMs, { channel: channel.type, status: "success" });
      meter.increment(NOTIFICATIONS_PROCESSED_BY_CHANNEL, { status: "success" });
    } catch (error) {
      const durationMs = Date.now() - start;

      meter.record(CHANNEL_LATENCY_MS, durationMs, { channel: channel.type, status: "failure" });
      meter.increment(NOTIFICATIONS_PROCESSED_BY_CHANNEL, { status: "failure" });

      throw error;
    }
  };

  return {
    type: channel.type,
    isSupports: channel.isSupports,
    send,
    checkHealth: channel.checkHealth,
  };
};
