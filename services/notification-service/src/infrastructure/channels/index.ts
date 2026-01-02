export type { BitrixChannelConfig } from "./createBitrixChannel/index.js";
export { createBitrixChannel } from "./createBitrixChannel/index.js";
export type { EmailChannelConfig } from "./createEmailChannel/index.js";
export { createEmailChannel } from "./createEmailChannel/index.js";
export type {
  LoggedChannelDependencies,
  MeteredChannelDependencies,
  TrasedChannelDependencies,
} from "./decorators/index.js";
export {
  createLoggedChannel,
  createMeteredChannel,
  createTracedChannel,
} from "./decorators/index.js";
