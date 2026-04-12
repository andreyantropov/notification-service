import { type Channel } from "../../../ports/index.js";
import { type Contact } from "../../../types/index.js";

import { type Attempt } from "./interfaces/index.js";

export const getAttempts = (
  contacts: readonly Contact[],
  channels: readonly Channel[],
): Attempt[] => {
  return contacts.flatMap((contact) =>
    channels
      .filter((channel) => channel.isSupports(contact))
      .map((channel) => ({ channel, contact })),
  );
};
