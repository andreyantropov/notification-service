export interface AuthenticationMiddlewareConfig {
  readonly issuer: string;
  readonly jwksUri: string;
  readonly audience: string;
  readonly tokenSigningAlg: string;
}
