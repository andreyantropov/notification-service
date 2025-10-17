import { LoggedBufferDependencies } from "./interfaces/LoggedBufferDependencies.js";
import { Buffer } from "../../../../application/ports/Buffer.js";
import { EventType } from "../../../telemetry/logging/enums/EventType.js";

export const createLoggedBuffer = <T>(
  dependencies: LoggedBufferDependencies<T>,
): Buffer<T> => {
  const { buffer, logger } = dependencies;

  const append = async (items: T[]): Promise<void> => {
    const start = Date.now();
    try {
      await buffer.append(items);
      const duration = Date.now() - start;
      logger.debug({
        message: `${items.length} элементов добавлено в буфер`,
        eventType: EventType.CacheOperation,
        duration,
        details: items,
      });
    } catch (error) {
      const duration = Date.now() - start;
      logger.error({
        message: "Не удалось добавить элементы в буфер",
        eventType: EventType.CacheOperation,
        duration,
        details: items,
        error,
      });
      throw error;
    }
  };

  const takeAll = async (): Promise<T[]> => {
    const start = Date.now();
    try {
      const result = await buffer.takeAll();
      const duration = Date.now() - start;
      logger.debug({
        message: `${result.length} элементов извлечено из буфера`,
        eventType: EventType.CacheOperation,
        duration,
        details: result,
      });
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error({
        message: "Не удалось извлечь элементы из буфера",
        eventType: EventType.CacheOperation,
        duration,
        error,
      });
      throw error;
    }
  };

  return { append, takeAll };
};
