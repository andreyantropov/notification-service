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
  withLogging as withDeliveryServiceLogging,
  withMetrics as withDeliveryServiceMetrics,
} from "../../../infrastructure/decorators/DeliveryService/index.js";
import {
  withLogging as withReceiveNotificationBatchLogging,
  withMetrics as withReceiveNotificationBatchMetrics,
} from "../../../infrastructure/decorators/ReceiveNotificationBatchUseCase/index.js";
import {
  withLogging as withReceiveNotificationUseCaseLogging,
  withMetrics as withReceiveNotificationUseCaseMetrics,
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
        const deliveryServiceWithLogging = withDeliveryServiceLogging({
          deliveryService: deliveryService,
          logger,
        });
        const deliveryServiceWithMetrics = withDeliveryServiceMetrics({
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
          withReceiveNotificationUseCaseLogging({
            receiveNotificationUseCase: receiveNotificationUseCase,
            logger,
          });
        const receiveNotificationUseCaseWithMetrics =
          withReceiveNotificationUseCaseMetrics({
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
          withReceiveNotificationBatchLogging({
            receiveNotificationBatchUseCase: receiveNotificationBatchUseCase,
            logger,
          });
        const receiveNotificationBatchUseCaseWithMetrics =
          withReceiveNotificationBatchMetrics({
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
