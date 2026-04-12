export const EVENT_TYPE = {
  LIFECYCLE: "lifecycle",
  REQUEST: "request",
  RESPONSE: "response",
  DATABASE: "database",
  INTEGRATION: "integration",
  MESSAGING: "messaging",
  SECURITY: "security",
  INTERNAL: "internal",
} as const;

export type EventType = (typeof EVENT_TYPE)[keyof typeof EVENT_TYPE];
