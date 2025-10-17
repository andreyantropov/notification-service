import { Receipt } from "../types/Receipt.js";

export interface ReceiptBatch {
  message: string;
  totalCount: number;
  acceptedCount: number;
  rejectedCount: number;
  details: Receipt[];
}
