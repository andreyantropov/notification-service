import {
  type Initiator,
  type Notification,
} from "../../../domain/types/index.js";
import { type IncomingNotification } from "../../types/index.js";

import { DEFAULT_DELIVERY_STRATEGY } from "./constants/index.js";
import {
  type EnrichmentService,
  type EnrichmentServiceDependencies,
} from "./interfaces/index.js";

export const createEnrichmentService = (
  dependencies: EnrichmentServiceDependencies,
): EnrichmentService => {
  const { idGenerator } = dependencies;

  const enrich = (
    incomingNotification: IncomingNotification,
    initiator: Initiator,
  ): Notification => {
    const notification: Notification = {
      ...incomingNotification,
      id: idGenerator.generateId(),
      createdAt: new Date().toISOString(),
      initiator,
      strategy: incomingNotification.strategy ?? DEFAULT_DELIVERY_STRATEGY,
    };

    return notification;
  };

  return { enrich };
};
