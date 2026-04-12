export const WINSTON_SEVERITY_LEVEL_TYPE = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  HTTP: 3,
  VERBOSE: 4,
  DEBUG: 5,
  SILLY: 6,
} as const;

export type WinstonSeverityLevelType =
  (typeof WINSTON_SEVERITY_LEVEL_TYPE)[keyof typeof WINSTON_SEVERITY_LEVEL_TYPE];
