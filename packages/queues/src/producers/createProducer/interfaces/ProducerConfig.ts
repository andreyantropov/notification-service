export interface ProducerConfig {
  readonly url: string;
  readonly queue: string;
  readonly publishTimeoutMs?: number;
  readonly healthcheckTimeoutMs?: number;
}
