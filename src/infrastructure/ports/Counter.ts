export interface Counter {
  readonly value: number;
  increase: () => void;
  decrease: () => void;
}
