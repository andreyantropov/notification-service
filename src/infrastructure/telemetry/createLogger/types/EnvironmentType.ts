export const ENVIRONMENT_TYPE = {
  DEVELOPMENT: "development",
  STAGING: "staging",
  PRODUCTION: "production",
} as const;

export type EnvironmentType =
  (typeof ENVIRONMENT_TYPE)[keyof typeof ENVIRONMENT_TYPE];
