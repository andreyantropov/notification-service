import { v4 } from "uuid";

import { type IdGenerator } from "../../../application/ports/index.js";

export const createIdGenerator = (): IdGenerator => {
  const generateId = (): string => v4();

  return { generateId };
};
