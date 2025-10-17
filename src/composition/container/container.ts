import { createContainer, InjectionMode } from "awilix";

import { Container } from "../types/Container.js";
import { registerServices } from "./application/servicesContainer.js";
import { registerUseCases } from "./application/useCasesContainer.js";
import { registerBuffer } from "./infrastracture/bufferContainer.js";
import { registerCounter } from "./infrastracture/counterContainer.js";
import { registerHttp } from "./infrastracture/httpContainer.js";
import { registerLogger } from "./infrastracture/loggerContainer.js";
import { registerTaskManager } from "./infrastracture/taskManagerContainer.js";
import { registerTelemetry } from "./infrastracture/tracingManagerContainer.js";

const container = createContainer<Container>({
  injectionMode: InjectionMode.PROXY,
});

registerLogger(container);
registerTelemetry(container);
registerCounter(container);
registerBuffer(container);
registerTaskManager(container);
registerHttp(container);
registerServices(container);
registerUseCases(container);

export { container };
