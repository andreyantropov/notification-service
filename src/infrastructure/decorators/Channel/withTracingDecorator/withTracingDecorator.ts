import { type Channel } from "../../../../domain/ports/index.js";
import { type Contact } from "../../../../domain/types/index.js";
import { SPAN_KIND } from "../../../telemetry/index.js";

import { type TracingDecoratorDependencies } from "./interfaces/index.js";

export const withTracingDecorator = (
  dependencies: TracingDecoratorDependencies,
): Channel => {
  const { channel, tracer } = dependencies;

  const send = async (contact: Contact, message: string): Promise<void> => {
    return tracer.startActiveSpan(
      `notification.send_to_channel`,
      async () => {
        await channel.send(contact, message);
      },
      {
        kind: SPAN_KIND.CLIENT,
        attributes: {
          channel: channel.type,
          contact: contact.type,
        },
      },
    );
  };

  return {
    ...channel,
    send,
  };
};
