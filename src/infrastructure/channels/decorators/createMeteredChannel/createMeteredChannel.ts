import { MeteredChannelDependencies } from "./interfaces/index.js";
import { Channel } from "../../../../domain/ports/index.js";
import { Contact } from "../../../../domain/types/index.js";

export const createMeteredChannel = (
  dependencies: MeteredChannelDependencies,
): Channel => {
  const { channel, meter } = dependencies;

  const send = async (contact: Contact, message: string): Promise<void> => {
    const start = Date.now();
    try {
      await channel.send(contact, message);
      const duration = Date.now() - start;

      meter.recordChannelLatency(duration, {
        channel: channel.type,
        result: "success",
      });

      meter.incrementNotificationsByChannel(channel.type, "success");
    } catch (error) {
      const duration = Date.now() - start;

      meter.recordChannelLatency(duration, {
        channel: channel.type,
        result: "failure",
      });

      meter.incrementNotificationsByChannel(channel.type, "failure");

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
