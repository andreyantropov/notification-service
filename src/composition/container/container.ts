import { createContainer, InjectionMode } from "awilix";

import { Container } from "../types/Container.js";
import { registerServices } from "./application/servicesContainer.js";
import { registerUseCases } from "./application/useCasesContainer.js";
import { registerHttp } from "./infrastracture/httpContainer.js";
import { registerLogger } from "./infrastracture/loggerContainer.js";
import { registerMeter } from "./infrastracture/meterContainer.js";
import { registerQueue } from "./infrastracture/queueContainer.js";
import { registerTracer } from "./infrastracture/tracerContainer.js";

const container = createContainer<Container>({
  injectionMode: InjectionMode.PROXY,
});

registerTracer(container);
registerLogger(container);
registerMeter(container);
registerQueue(container);
registerHttp(container);
registerServices(container);
registerUseCases(container);

export { container };
