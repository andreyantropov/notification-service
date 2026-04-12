import { asFunction, type AwilixContainer } from "awilix";

import {
  createDeliveryService,
  createEnrichmentService,
  createHealthService,
} from "../../../application/services/index.js";
import {
  createCheckLivenessUseCase,
  createCheckReadinessUseCase,
  createReceiveNotificationBatchUseCase,
  createReceiveNotificationUseCase,
} from "../../../application/useCases/index.js";
import {
  withLoggingDecorator as withDeliveryServiceLoggingDecorator,
  withMetricsDecorator as withDeliveryServiceMetricsDecorator,
} from "../../../infrastructure/decorators/DeliveryService/index.js";
import {
  withLoggingDecorator as withReceiveNotificationBatchLoggingDecorator,
  withMetricsDecorator as withReceiveNotificationBatchMetricsDecorator,
} from "../../../infrastructure/decorators/ReceiveNotificationBatchUseCase/index.js";
import {
  withLoggingDecorator as withReceiveNotificationUseCaseLoggingDecorator,
  withMetricsDecorator as withReceiveNotificationUseCaseMetricsDecorator,
} from "../../../infrastructure/decorators/ReceiveNotificationUseCase/index.js";
import { type Container } from "../interfaces/Container.js";

export const registerApplication = (container: AwilixContainer<Container>) => {
  container.register({
    enrichmentService: asFunction(({ idGenerator }) => {
      return createEnrichmentService({ idGenerator });
    }).singleton(),

    deliveryService: asFunction(
      ({ bitrixChannel, emailChannel, logger, meter }) => {
        const deliveryService = createDeliveryService({
          channels: [bitrixChannel, emailChannel],
        });
        const deliveryServiceWithLogging = withDeliveryServiceLoggingDecorator({
          deliveryService: deliveryService,
          logger,
        });
        const deliveryServiceWithMetrics = withDeliveryServiceMetricsDecorator({
          deliveryService: deliveryServiceWithLogging,
          meter,
        });

        return deliveryServiceWithMetrics;
      },
    ).singleton(),

    healthService: asFunction(({ healthReporter }) => {
      return createHealthService({ healthReporter });
    }).singleton(),

    receiveNotificationUseCase: asFunction(
      ({ logger, meter, enrichmentService, deliveryService }) => {
        const receiveNotificationUseCase = createReceiveNotificationUseCase({
          enrichmentService,
          deliveryService,
        });
        const receiveNotificationUseCaseWithLogging =
          withReceiveNotificationUseCaseLoggingDecorator({
            receiveNotificationUseCase: receiveNotificationUseCase,
            logger,
          });
        const receiveNotificationUseCaseWithMetrics =
          withReceiveNotificationUseCaseMetricsDecorator({
            receiveNotificationUseCase: receiveNotificationUseCaseWithLogging,
            meter,
          });

        return receiveNotificationUseCaseWithMetrics;
      },
    ).singleton(),

    receiveNotificationBatchUseCase: asFunction(
      ({ logger, meter, enrichmentService, deliveryService }) => {
        const receiveNotificationBatchUseCase =
          createReceiveNotificationBatchUseCase({
            enrichmentService,
            deliveryService,
          });
        const receiveNotificationBatchUseCaseWithLogging =
          withReceiveNotificationBatchLoggingDecorator({
            receiveNotificationBatchUseCase: receiveNotificationBatchUseCase,
            logger,
          });
        const receiveNotificationBatchUseCaseWithMetrics =
          withReceiveNotificationBatchMetricsDecorator({
            receiveNotificationBatchUseCase:
              receiveNotificationBatchUseCaseWithLogging,
            meter,
          });

        return receiveNotificationBatchUseCaseWithMetrics;
      },
    ).singleton(),

    checkLivenessUseCase: asFunction(({ healthService }) => {
      const useCase = createCheckLivenessUseCase({
        healthService,
      });

      return useCase;
    }).singleton(),

    checkReadinessUseCase: asFunction(({ healthService }) => {
      const useCase = createCheckReadinessUseCase({
        healthService,
      });

      return useCase;
    }).singleton(),
  });
};
