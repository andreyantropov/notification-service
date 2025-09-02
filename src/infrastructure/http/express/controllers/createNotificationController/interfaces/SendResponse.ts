import { SendResult } from "../types/SendResult.js";

export interface SendResponse {
  message: string;
  totalCount: number;
  validCount: number;
  invalidCount: number;
  details: SendResult[];
}
