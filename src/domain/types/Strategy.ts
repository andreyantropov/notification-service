import { type Channel } from "../ports/index.js";

import { type Notification } from "./Notification.js";

export type Strategy = (
  notification: Notification,
  channels: readonly Channel[],
) => Promise<void>;
