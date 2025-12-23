import { createContainer, InjectionMode } from "awilix";

import { registerChannels } from "./channelsContainer.js";
import { registerGenerator } from "./generatorContainer.js";
import { registerHttp } from "./httpContainer.js";
import { registerQueue } from "./queueContainer.js";
import { registerServices } from "./servicesContainer.js";
import { registerTelemetry } from "./telemetryContainer.js";
import { registerUseCases } from "./useCasesContainer.js";
import type { Container } from "../types/Container.js";

const container = createContainer<Container>({
  injectionMode: InjectionMode.PROXY,
});

registerTelemetry(container);
registerQueue(container);
registerHttp(container);
registerChannels(container);
registerGenerator(container);
registerServices(container);
registerUseCases(container);

export { container };
