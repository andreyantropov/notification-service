export const SPAN_KIND = {
  SERVER: "SERVER",
  CLIENT: "CLIENT",
  INTERNAL: "INTERNAL",
  PRODUCER: "PRODUCER",
  CONSUMER: "CONSUMER",
} as const;

export type SpanKind = (typeof SPAN_KIND)[keyof typeof SPAN_KIND];
