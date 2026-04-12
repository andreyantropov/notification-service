import { type Notification } from "../../domain/types/index.js";

import { type NOTIFY_STATUS } from "./NotifyStatus.js";

export type NotificationResult =
  | {
      readonly status:
        | typeof NOTIFY_STATUS.CLIENT_ERROR
        | typeof NOTIFY_STATUS.SERVER_ERROR;
      readonly error: {
        readonly message: string;
        readonly details?: unknown;
      };
    }
  | {
      readonly status: typeof NOTIFY_STATUS.SUCCESS;
      readonly payload: Notification;
    };
