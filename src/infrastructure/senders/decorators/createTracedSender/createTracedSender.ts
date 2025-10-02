import { TrasedSenderDependencies } from "./interfaces/TracedSenderDependencies.js";
import { Sender } from "../../../../domain/ports/Sender.js";
import { Recipient } from "../../../../domain/types/Recipient.js";

export const createTracedSender = (
  dependencies: TrasedSenderDependencies,
): Sender => {
  const { sender, tracingContextManager } = dependencies;

  const send = async (recipient: Recipient, message: string): Promise<void> => {
    return tracingContextManager.startActiveSpan(
      `${sender.type}.send`,
      {
        kind: "CLIENT",
        attributes: {
          "sender.type": sender.type,
          "recipient.type": recipient.type,
          "recipient.value": recipient.value,
        },
      },
      async () => {
        await sender.send(recipient, message);
      },
    );
  };

  const checkHealth = sender.checkHealth
    ? async (): Promise<void> => {
        return tracingContextManager.startActiveSpan(
          `${sender.type}.checkHealth`,
          {
            kind: "CLIENT",
          },
          async () => {
            await sender.checkHealth!();
          },
        );
      }
    : undefined;

  return {
    type: sender.type,
    isSupports: sender.isSupports,
    send,
    checkHealth,
  };
};
