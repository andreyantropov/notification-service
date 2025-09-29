import { Logger } from "../../ports/Logger.js";
import { Log } from "../../types/Log.js";

export const createConsoleLogger = (): Logger => {
  const writeLog = async (log: Log): Promise<void> => {
    try {
      console.log(JSON.stringify(log));
    } catch (error) {
      throw new Error("Не удалось записать данные в консоль", { cause: error });
    }
  };

  return { writeLog };
};
