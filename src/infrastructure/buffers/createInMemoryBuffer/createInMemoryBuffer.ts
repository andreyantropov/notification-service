import { Buffer } from "../../../application/ports/Buffer.js";
import { BufferedNotification } from "../../../application/types/BufferedNotification.js";

export const createInMemoryBuffer = (): Buffer<BufferedNotification> => {
  let buffer: BufferedNotification[] = [];

  const append = async (items: BufferedNotification[]): Promise<void> => {
    buffer.push(...items);
  };

  const takeAll = async (): Promise<BufferedNotification[]> => {
    const result = [...buffer];
    buffer = [];
    return result;
  };

  return { append, takeAll };
};
