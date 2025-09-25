import {
  trace,
  SpanKind,
  context,
  SpanStatusCode,
  Exception,
} from "@opentelemetry/api";

import { TrasedSenderDependencies } from "./interfaces/TracedSenderDependencies.js";
import { Sender } from "../../../domain/ports/Sender.js";
import { Recipient } from "../../../domain/types/Recipient.js";

const tracer = trace.getTracer("notification-senders");

export const createTracedSender = (
  dependencies: TrasedSenderDependencies,
): Sender => {
  const { sender } = dependencies;

  const send = async (recipient: Recipient, message: string): Promise<void> => {
    return tracer.startActiveSpan(
      `${sender.constructor.name}.send`,
      {
        kind: SpanKind.CLIENT,
        attributes: {
          "sender.type": sender.constructor.name,
          "recipient.type": recipient.type,
          "recipient.value": recipient.value,
        },
      },
      async (span) => {
        try {
          await context.with(trace.setSpan(context.active(), span), () =>
            sender.send(recipient, message),
          );
          span.end();
        } catch (error) {
          span.recordException(error as Exception);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error instanceof Error ? error.message : String(error),
          });
          span.end();
          throw error;
        }
      },
    );
  };

  const checkHealth = sender.checkHealth
    ? async (): Promise<void> => {
        return tracer.startActiveSpan(
          `${sender.constructor.name}.checkHealth`,
          {
            kind: SpanKind.CLIENT,
          },
          async (span) => {
            try {
              await context.with(trace.setSpan(context.active(), span), () =>
                sender.checkHealth!(),
              );
              span.end();
            } catch (error) {
              span.recordException(error as Exception);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error instanceof Error ? error.message : String(error),
              });
              span.end();
              throw error;
            }
          },
        );
      }
    : undefined;

  return {
    isSupports: sender.isSupports,
    send,
    checkHealth,
  };
};
