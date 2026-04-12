export const TRIGGER_TYPE = {
  CRON: "cron",
  MANUAL: "manual",
  API: "api",
  QUEUE: "queue",
} as const;

export type TriggerType = (typeof TRIGGER_TYPE)[keyof typeof TRIGGER_TYPE];
