export interface AuthenticationMiddlewareConfig {
  issuer: string;
  jwksUri: string;
  audience: string;
  tokenSigningAlg?: string;
}
