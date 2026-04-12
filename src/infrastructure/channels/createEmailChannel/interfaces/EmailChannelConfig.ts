export interface EmailChannelConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly auth: {
    readonly user: string;
    readonly pass: string;
  };
  readonly fromEmail: string;
  readonly subject: string;
  readonly greetingTimeoutMs: number;
  readonly socketTimeoutMs: number;
}
