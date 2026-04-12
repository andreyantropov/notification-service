import {
  type DeliveryService,
  type EnrichmentService,
} from "../../../services/index.js";

export interface ReceiveNotificationBatchUseCaseDependencies {
  readonly enrichmentService: EnrichmentService;
  readonly deliveryService: DeliveryService;
}
