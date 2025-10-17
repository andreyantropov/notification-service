import { Log } from "../interfaces/Log.js";
import { Logger } from "../interfaces/Logger.js";

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
