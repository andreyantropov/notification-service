import { Buffer } from "../../../application/ports/Buffer.js";

export const createInMemoryBuffer = <T>(): Buffer<T> => {
  let buffer: T[] = [];

  const append = async (items: T[]): Promise<void> => {
    buffer.push(...items);
  };

  const takeAll = async (): Promise<T[]> => {
    const result = [...buffer];
    buffer = [];
    return result;
  };

  return { append, takeAll };
};
