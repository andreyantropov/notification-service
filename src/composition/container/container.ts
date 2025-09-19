import { createContainer, InjectionMode } from "awilix";

import { Container } from "../types/Container.js";
import { registerJobs } from "./application/jobs.container.js";
import { registerServices } from "./application/services.container.js";
import { registerUseCases } from "./application/useCases.container.js";
import { registerBuffer } from "./infrastracture/buffer.container.js";
import { registerCounter } from "./infrastracture/counter.container.js";
import { registerHttp } from "./infrastracture/http.container.js";
import { registerLogger } from "./infrastracture/logger.container.js";

const container = createContainer<Container>({
  injectionMode: InjectionMode.PROXY,
});

registerLogger(container);
registerCounter(container);
registerBuffer(container);
registerHttp(container);
registerServices(container);
registerUseCases(container);
registerJobs(container);

export { container };
