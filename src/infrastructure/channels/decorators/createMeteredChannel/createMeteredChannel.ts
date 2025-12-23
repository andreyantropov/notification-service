import type { MeteredChannelDependencies } from "./interfaces/index.js";
import type { Channel } from "../../../../domain/ports/index.js";
import type { Contact } from "../../../../domain/types/index.js";

export const createMeteredChannel = (
  dependencies: MeteredChannelDependencies,
): Channel => {
  const { channel, meter } = dependencies;

  const send = async (contact: Contact, message: string): Promise<void> => {
    const start = Date.now();
    try {
      await channel.send(contact, message);
      const durationMs = Date.now() - start;

      meter.recordChannelLatency(durationMs, {
        channel: channel.type,
        result: "success",
      });

      meter.incrementNotificationsProcessedByChannel(channel.type, "success");
    } catch (error) {
      const durationMs = Date.now() - start;

      meter.recordChannelLatency(durationMs, {
        channel: channel.type,
        result: "failure",
      });

      meter.incrementNotificationsProcessedByChannel(channel.type, "failure");

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
