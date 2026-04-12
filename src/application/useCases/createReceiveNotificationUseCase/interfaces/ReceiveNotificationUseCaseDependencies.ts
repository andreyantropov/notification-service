import {
  type DeliveryService,
  type EnrichmentService,
} from "../../../services/index.js";

export interface ReceiveNotificationUseCaseDependencies {
  readonly enrichmentService: EnrichmentService;
  readonly deliveryService: DeliveryService;
}
