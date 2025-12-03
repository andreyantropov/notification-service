import { v4 as uuidv4 } from "uuid";

import { Generator } from "../../../application/types/index.js";

export const createGenerator = (): Generator => {
  return (): string => uuidv4();
};
