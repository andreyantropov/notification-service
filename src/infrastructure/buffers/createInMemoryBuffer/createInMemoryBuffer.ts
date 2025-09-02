import { Buffer } from "../../../application/ports/Buffer.js";
import { Notification } from "../../../domain/types/Notification.js";

export const createInMemoryBuffer = (): Buffer<Notification> => {
  let buffer: Notification[] = [];

  const append = async (items: Notification[]): Promise<void> => {
    buffer.push(...items);
  };

  const takeAll = async (): Promise<Notification[]> => {
    const result = [...buffer];
    buffer = [];
    return result;
  };

  return { append, takeAll };
};
