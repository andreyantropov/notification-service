import { TracedBufferDependencies } from "./interfaces/TracedBufferDependencies.js";
import { Buffer } from "../../../../application/ports/Buffer.js";

export const createTracedBuffer = <T>(
  dependencies: TracedBufferDependencies<T>,
): Buffer<T> => {
  const { buffer, tracingContextManager } = dependencies;

  const append = async (items: T[]): Promise<void> => {
    return tracingContextManager.startActiveSpan(
      `${buffer.constructor.name}.append`,
      {
        kind: "INTERNAL",
        attributes: {
          "buffer.type": buffer.constructor.name,
          "buffer.items.count": items.length,
        },
      },
      async () => {
        await buffer.append(items);
      },
    );
  };

  const takeAll = async (): Promise<T[]> => {
    return tracingContextManager.startActiveSpan(
      `${buffer.constructor.name}.takeAll`,
      {
        kind: "INTERNAL",
      },
      async () => {
        return buffer.takeAll();
      },
    );
  };

  return { append, takeAll };
};
