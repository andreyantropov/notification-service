import { type IdGenerator } from "../../../ports/index.js";

export interface EnrichmentServiceDependencies {
  readonly idGenerator: IdGenerator;
}
