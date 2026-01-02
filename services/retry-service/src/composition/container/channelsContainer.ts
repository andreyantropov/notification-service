import type { AwilixContainer } from "awilix";
import { asFunction } from "awilix";

import {
  bitrixChannelConfig,
  emailChannelConfig,
} from "../../configs/index.js";
import {
  createBitrixChannel,
  createLoggedChannel,
  createMeteredChannel,
  createEmailChannel,
  createTracedChannel,
} from "../../infrastructure/channels/index.js";
import type { Container } from "../types/index.js";

export const registerChannels = (container: AwilixContainer<Container>) => {
  container.register({
    bitrixChannel: asFunction(({ logger, meter }) => {
      if (!bitrixChannelConfig) {
        return undefined;
      }

      const bitrixChannel = createBitrixChannel(bitrixChannelConfig);
      const loggedBitrixChannel = createLoggedChannel({
        channel: bitrixChannel,
        logger,
      });
      return createMeteredChannel({ channel: loggedBitrixChannel, meter });
    }).singleton(),
    emailChannel: asFunction(({ tracer, logger, meter }) => {
      if (!emailChannelConfig) {
        return undefined;
      }

      const emailChannel = createEmailChannel(emailChannelConfig);
      const tracedEmailChannel = createTracedChannel({
        channel: emailChannel,
        tracer,
      });
      const loggedTracedEmailChannel = createLoggedChannel({
        channel: tracedEmailChannel,
        logger,
      });
      return createMeteredChannel({
        channel: loggedTracedEmailChannel,
        meter,
      });
    }).singleton(),
  });
};
