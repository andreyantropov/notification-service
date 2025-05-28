import { NotificationSource } from "../../domain/interfaces/NotificationSource";
import { createFirebirdSource } from "../sources/firebirdSource";
import { FirebirdSourceConfig } from "../sources/firebirdSource/interfaces/FirebirdSourceConfig";

export const createDefaultSource = (
  firebirdConfig: FirebirdSourceConfig,
): NotificationSource => {
  return createFirebirdSource(firebirdConfig);
};
