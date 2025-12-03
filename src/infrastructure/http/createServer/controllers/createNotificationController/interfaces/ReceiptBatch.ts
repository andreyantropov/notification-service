import { Receipt } from "../types/Receipt.js";

export interface ReceiptBatch {
  readonly message: string;
  readonly totalCount: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly details: readonly Receipt[];
}
