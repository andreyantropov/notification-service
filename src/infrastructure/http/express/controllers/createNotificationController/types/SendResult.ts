import z from "zod";
import { SingleNotification } from "../../../../../../api/schemas/NotificationRequest.js";

export type SendResult =
  | { success: true; notification: z.infer<typeof SingleNotification> }
  | {
      success: false;
      notification: z.infer<typeof SingleNotification>;
      error: unknown;
    };
