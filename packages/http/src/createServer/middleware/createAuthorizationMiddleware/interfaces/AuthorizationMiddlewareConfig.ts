export interface AuthorizationMiddlewareConfig {
  readonly serviceClientId: string;
  readonly requiredRoles: readonly string[];
}
