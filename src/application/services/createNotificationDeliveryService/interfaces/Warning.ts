export interface Warning {
  readonly message: string;
  readonly details?: unknown;
  readonly contact?: string;
  readonly channel?: string;
}
