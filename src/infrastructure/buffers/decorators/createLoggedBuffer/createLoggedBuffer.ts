import { LoggedBufferDependencies } from "./interfaces/LoggedBufferDependencies.js";
import { Buffer } from "../../../../application/ports/Buffer.js";
import { EventType } from "../../../../shared/enums/EventType.js";

export const createLoggedBuffer = <T>(
  dependencies: LoggedBufferDependencies<T>,
): Buffer<T> => {
  const { buffer, loggerAdapter } = dependencies;

  const append = async (items: T[]): Promise<void> => {
    try {
      await buffer.append(items);
      loggerAdapter.debug({
        message: `${items.length} элементов добавлено в буфер`,
        eventType: EventType.CacheOperation,
        details: items,
      });
    } catch (error) {
      loggerAdapter.error({
        message: "Не удалось добавить элементы в буфер",
        eventType: EventType.CacheOperation,
        details: items,
        error,
      });
      throw error;
    }
  };

  const takeAll = async (): Promise<T[]> => {
    try {
      const result = await buffer.takeAll();
      loggerAdapter.debug({
        message: `${result.length} элементов извлечено из буфера`,
        eventType: EventType.CacheOperation,
        details: result,
      });
      return result;
    } catch (error) {
      loggerAdapter.error({
        message: "Не удалось извлечь элементы из буфера",
        eventType: EventType.CacheOperation,
        error,
      });
      throw error;
    }
  };

  return { append, takeAll };
};
