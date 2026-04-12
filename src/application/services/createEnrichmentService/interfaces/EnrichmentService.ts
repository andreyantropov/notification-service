import {
  type Initiator,
  type Notification,
} from "../../../../domain/types/index.js";
import { type IncomingNotification } from "../../../types/index.js";

export interface EnrichmentService {
  readonly enrich: (
    incomingNotification: IncomingNotification,
    initiator: Initiator,
  ) => Notification;
}
