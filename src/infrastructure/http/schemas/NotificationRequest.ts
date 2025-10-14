import { z } from "zod";

import { SingleNotification } from "./SingleNotification.js";

export const NotificationRequest = z.union([
  SingleNotification,
  z.array(SingleNotification).min(1).max(100),
]);
