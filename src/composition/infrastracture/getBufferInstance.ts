import { Buffer } from "../../application/ports/Buffer.js";
import { Notification } from "../../domain/types/Notification.js";
import { createInMemoryBuffer } from "../../infrastructure/buffers/createInMemoryBuffer/index.js";

let instance: Buffer<Notification> | null = null;

export const getBufferInstance = (): Buffer<Notification> => {
  if (instance === null) {
    instance = createInMemoryBuffer();
  }

  return instance;
};
