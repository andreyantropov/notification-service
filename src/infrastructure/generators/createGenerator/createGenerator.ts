import { v4 as uuidv4 } from "uuid";

import type { Generator } from "../../../application/types/index.js";

export const createGenerator = (): Generator => {
  return (): string => uuidv4();
};
