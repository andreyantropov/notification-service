import { z } from "zod";

import { IncomingNotificationSchema } from "./IncomingNotificationSchema.js";

export const NotificationRequestSchema = z.union([
  IncomingNotificationSchema,
  z.array(IncomingNotificationSchema).min(1).max(100),
]);
