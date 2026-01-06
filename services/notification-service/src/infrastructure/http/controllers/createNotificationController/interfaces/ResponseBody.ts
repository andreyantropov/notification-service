import type { Detail } from "../types/index.js";

export interface ResponseBody {
  readonly message: string;
  readonly totalCount: number;
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly details: readonly Detail[];
}
