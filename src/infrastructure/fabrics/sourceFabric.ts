import { NotificationSource } from "../../domain/interfaces/NotificationSource.js";
import { createFirebirdSource } from "../sources/firebirdSource/index.js";
import { FirebirdSourceConfig } from "../sources/firebirdSource/interfaces/FirebirdSourceConfig.js";

export const createDefaultSource = (
  firebirdConfig: FirebirdSourceConfig,
): NotificationSource => {
  return createFirebirdSource(firebirdConfig);
};
