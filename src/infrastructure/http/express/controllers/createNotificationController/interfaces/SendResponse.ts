import z from "zod";
import { SingleNotification } from "../../../../../../api/schemas/NotificationRequest.js";

export interface SendResponse {
  message: string;
  totalCount: number;
  successCount: number;
  validationErrorCount: number;
  deliveryErrorCount: number;
  details: Array<
    | {
        status: "success";
        notification: z.infer<typeof SingleNotification>;
      }
    | {
        status: "error";
        notification: unknown;
        error?: unknown;
        message?: string;
        errors?: z.ZodIssue[];
      }
  >;
}
