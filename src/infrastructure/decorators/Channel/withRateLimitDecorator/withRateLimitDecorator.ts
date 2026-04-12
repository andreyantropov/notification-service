import { setTimeout } from "node:timers/promises";

import pLimit from "p-limit";

import { type Channel } from "../../../../domain/ports/index.js";
import { type Contact } from "../../../../domain/types/index.js";

import {
  type RateLimitDecoratorConfig,
  type RateLimitDecoratorDependencies,
} from "./interfaces/index.js";

export const withRateLimitDecorator = (
  dependencies: RateLimitDecoratorDependencies,
  config: RateLimitDecoratorConfig,
): Channel => {
  const { channel } = dependencies;
  const { concurrency, delayMs } = config;

  const limit = pLimit(concurrency);

  const send = async (contact: Contact, message: string): Promise<void> => {
    return limit(async () => {
      try {
        await channel.send(contact, message);
      } finally {
        if (delayMs > 0) {
          await setTimeout(delayMs);
        }
      }
    });
  };

  const checkHealth = channel.checkHealth
    ? async (): Promise<void> => {
        return limit(async () => {
          try {
            await channel.checkHealth!();
          } finally {
            if (delayMs > 0) {
              await setTimeout(delayMs);
            }
          }
        });
      }
    : undefined;

  return {
    ...channel,
    send,
    checkHealth,
  };
};
