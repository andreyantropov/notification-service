import { asFunction, AwilixContainer } from "awilix";

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
import { Container } from "../types/index.js";

export const registerChannels = (container: AwilixContainer<Container>) => {
  container.register({
    bitrixChannel: asFunction(({ logger, meter }) => {
      const bitrixChannel = createBitrixChannel(bitrixChannelConfig);
      const loggedBitrixChannel = createLoggedChannel({
        channel: bitrixChannel,
        logger,
      });
      const meteredLoggedBitrixChannel = createMeteredChannel({
        channel: loggedBitrixChannel,
        meter,
      });

      return meteredLoggedBitrixChannel;
    }).singleton(),
    emailChannel: asFunction(({ tracer, logger, meter }) => {
      const emailChannel = createEmailChannel(emailChannelConfig);
      const tracedEmailChannel = createTracedChannel({
        channel: emailChannel,
        tracer,
      });
      const loggedTracedEmailChannel = createLoggedChannel({
        channel: tracedEmailChannel,
        logger,
      });
      const meteredLoggedTracedEmailChannel = createMeteredChannel({
        channel: loggedTracedEmailChannel,
        meter,
      });

      return meteredLoggedTracedEmailChannel;
    }).singleton(),
  });
};
