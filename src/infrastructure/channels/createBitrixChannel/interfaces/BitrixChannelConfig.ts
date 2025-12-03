export interface BitrixChannelConfig {
  readonly baseUrl: string;
  readonly userId: string;
  readonly authToken: string;
  readonly sendTimeoutMs?: number;
  readonly healthcheckTimeoutMs?: number;
}
