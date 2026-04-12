import { asFunction, type AwilixContainer } from "awilix";

import {
  createBitrixChannel,
  createEmailChannel,
  createMockBitrixChannel,
  createMockEmailChannel,
} from "../../../infrastructure/channels/index.js";
import { createIdGenerator } from "../../../infrastructure/crypto/index.js";
import {
  withRateLimitDecorator as withChannelLimitDecorator,
  withLoggingDecorator as withChannelLoggingDecorator,
  withMetricsDecorator as withChannelMetricsDecorator,
  withTracingDecorator as withChannelTracingDecorator,
} from "../../../infrastructure/decorators/Channel/index.js";
import { withLoggingDecorator as withServerLoggingDecorator } from "../../../infrastructure/decorators/Server/index.js";
import { createHealthReporter } from "../../../infrastructure/health/index.js";
import { createServer } from "../../../infrastructure/http/index.js";
import {
  createLogger,
  createMeter,
  createTracer,
} from "../../../infrastructure/telemetry/index.js";
import { type Container } from "../interfaces/index.js";

export const registerInfrastracture = (
  container: AwilixContainer<Container>,
) => {
  container.register({
    bitrixChannel: asFunction(({ env, logger, meter }) => {
      const bitrixChannel =
        env.NODE_ENV === "production"
          ? createBitrixChannel({
              baseUrl: env.BITRIX_CHANNEL_BASE_URL,
              userId: env.BITRIX_CHANNEL_USER_ID,
              authToken: env.BITRIX_CHANNEL_AUTH_TOKEN,
              timeoutMs: env.BITRIX_TIMEOUT_MS,
            })
          : createMockBitrixChannel();
      const bitrixChannelWithLogging = withChannelLoggingDecorator({
        channel: bitrixChannel,
        logger,
      });
      const bitrixChannelWithMetrics = withChannelMetricsDecorator({
        channel: bitrixChannelWithLogging,
        meter,
      });
      const bitrixChannelWithRateLimit = withChannelLimitDecorator(
        { channel: bitrixChannelWithMetrics },
        {
          concurrency: env.BITRIX_CHANNEL_CONCURRENCY,
          delayMs: env.BITRIX_CHANNEL_DELAY_MS,
        },
      );

      return bitrixChannelWithRateLimit;
    }).singleton(),

    emailChannel: asFunction(({ env, tracer, logger, meter }) => {
      const emailChannel =
        env.NODE_ENV === "production"
          ? createEmailChannel({
              host: env.EMAIL_CHANNEL_HOST,
              port: env.EMAIL_CHANNEL_PORT,
              secure: env.EMAIL_CHANNEL_SECURE,
              auth: {
                user: env.EMAIL_CHANNEL_LOGIN,
                pass: env.EMAIL_CHANNEL_PASSWORD,
              },
              fromEmail: env.EMAIL_CHANNEL_FROM_EMAIL,
              subject: env.EMAIL_CHANNEL_SUBJECT,
              greetingTimeoutMs: env.EMAIL_CHANNEL_GREETING_TIMEOUT_MS,
              socketTimeoutMs: env.EMAIL_CHANNEL_SOCKET_TIMEOUT_MS,
            })
          : createMockEmailChannel();
      const emailChannelWithTracing = withChannelTracingDecorator({
        channel: emailChannel,
        tracer,
      });
      const emailChannelWithLogging = withChannelLoggingDecorator({
        channel: emailChannelWithTracing,
        logger,
      });
      const emailChannelWithMetrics = withChannelMetricsDecorator({
        channel: emailChannelWithLogging,
        meter,
      });
      const emailChannelWithRateLimit = withChannelLimitDecorator(
        { channel: emailChannelWithMetrics },
        {
          concurrency: env.EMAIL_CHANNEL_CONCURRENCY,
          delayMs: env.EMAIL_CHANNEL_DELAY_MS,
        },
      );

      return emailChannelWithRateLimit;
    }).singleton(),

    idGenerator: asFunction(() => {
      return createIdGenerator();
    }).singleton(),

    healthReporter: asFunction(({ bitrixChannel, emailChannel }) => {
      return createHealthReporter({ objects: [bitrixChannel, emailChannel] });
    }).singleton(),

    logger: asFunction(({ env }) => {
      return createLogger({ level: env.LOG_LEVEL });
    }).singleton(),

    meter: asFunction(({ env }) => {
      return createMeter({ serviceName: env.SERVICE_NAME });
    }).singleton(),

    tracer: asFunction(({ env }) => {
      return createTracer({ serviceName: env.SERVICE_NAME });
    }).singleton(),

    server: asFunction(({ env, logger, preHandlers, router, postHandlers }) => {
      const server = createServer(
        { preHandlers, router, postHandlers },
        { port: env.SERVICE_PORT },
      );
      const serverWithLogging = withServerLoggingDecorator({ server, logger });

      return serverWithLogging;
    }).singleton(),
  });
};
