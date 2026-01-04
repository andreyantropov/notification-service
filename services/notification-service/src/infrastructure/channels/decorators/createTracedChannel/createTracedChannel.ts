import type { TrasedChannelDependencies } from "./interfaces/index.js";
import type { Channel } from "../../../../domain/ports/index.js";
import type { Contact } from "@notification-platform/shared";

export const createTracedChannel = (
  dependencies: TrasedChannelDependencies,
): Channel => {
  const { channel, tracer } = dependencies;

  const send = async (contact: Contact, message: string): Promise<void> => {
    return tracer.startActiveSpan(
      `${channel.type}.send`,
      {
        kind: "CLIENT",
        attributes: {
          channelType: channel.type,
          contactType: contact.type,
        },
      },
      async () => {
        await channel.send(contact, message);
      },
    );
  };

  const checkHealth = channel.checkHealth
    ? async (): Promise<void> => {
      return tracer.startActiveSpan(
        `${channel.type}.checkHealth`,
        {
          kind: "CLIENT",
        },
        async () => {
          await channel.checkHealth!();
        },
      );
    }
    : undefined;

  return {
    type: channel.type,
    isSupports: channel.isSupports,
    send,
    checkHealth,
  };
};
