import { TrasedChannelDependencies } from "./interfaces/TracedChannelDependencies.js";
import { Channel } from "../../../../domain/ports/Channel.js";
import { Contact } from "../../../../domain/types/Contact.js";

export const createTracedChannel = (
  dependencies: TrasedChannelDependencies,
): Channel => {
  const { channel, tracingContextManager } = dependencies;

  const send = async (contact: Contact, message: string): Promise<void> => {
    return tracingContextManager.startActiveSpan(
      `${channel.type}.send`,
      {
        kind: "CLIENT",
        attributes: {
          "channel.type": channel.type,
          "contact.type": contact.type,
          "contact.value": contact.value,
        },
      },
      async () => {
        await channel.send(contact, message);
      },
    );
  };

  const checkHealth = channel.checkHealth
    ? async (): Promise<void> => {
        return tracingContextManager.startActiveSpan(
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
