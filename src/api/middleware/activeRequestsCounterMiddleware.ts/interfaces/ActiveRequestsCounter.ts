export interface ActiveRequestsCounter {
  readonly value: number;
  increase: () => void;
  decrease: () => void;
}
