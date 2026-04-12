export interface CheckLivenessUseCase {
  readonly execute: () => Promise<void>;
}
