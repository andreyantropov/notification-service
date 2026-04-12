export const NOTIFY_STATUS = {
  SUCCESS: "success",
  CLIENT_ERROR: "client_error",
  SERVER_ERROR: "server_error",
} as const;

export type NotifyStatus = (typeof NOTIFY_STATUS)[keyof typeof NOTIFY_STATUS];
