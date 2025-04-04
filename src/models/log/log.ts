import { v4 as uuidv4 } from "uuid";
import Log from "../../interfaces/Log";
import { TriggerType } from "../../enum/TriggerType";
import { LogLevel } from "../../enum/LogLevel";
import { promises as fs } from "fs";
import path from "path";

const getCallerServiceName = (callerService?: string): string => {
  return callerService || process.env.CALLER_SERVICE || "UnknownService";
};

const getTriggerType = (trigger?: TriggerType): TriggerType => {
  if (trigger) {
    return trigger;
  }
  return process.env.TRIGGER_TYPE === TriggerType.Cron
    ? TriggerType.Cron
    : TriggerType.Manual;
};

const getCurrentServiceName = (): string => {
  return process.env.CURRENT_SERVICE || "UnknownService";
};

const errorToObject = (error?: any): any => {
  if (!error) return undefined;

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...((error as any).details && { details: (error as any).details }),
    };
  }

  return error;
};

const ensureLogDirectoryExists = async (): Promise<void> => {
  const logDir = path.join(process.cwd(), "log");
  try {
    await fs.mkdir(logDir, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") {
      console.error("Не удалось создать директорию:", err);
    }
  }
};

const getLogFileName = (level: LogLevel, timestamp: Date): string => {
  const dateStr = timestamp.getTime();
  return `${level}-${dateStr}.log`;
};

export const log = async (
  level: LogLevel,
  message: string,
  options: {
    callerService?: string;
    trigger?: TriggerType;
    eventType?: string;
    payload?: any;
    error?: Error;
    durationMs?: number;
  } = {},
): Promise<void> => {
  const log: Log = {
    id: uuidv4(),
    timestamp: new Date(),
    callerService: getCallerServiceName(options.callerService),
    trigger: getTriggerType(options.trigger),
    currentService: getCurrentServiceName(),
    level,
    message,
    eventType: options.eventType,
    payload: options.payload,
    error: errorToObject(options.error),
    durationMs: options.durationMs,
  };

  console.log(JSON.stringify(log, null, 2));

  try {
    await ensureLogDirectoryExists();
    const logDir = path.join(process.cwd(), "log");
    const fileName = getLogFileName(level, new Date());
    const filePath = path.join(logDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(log, null, 2));
  } catch (err) {
    console.error("Не удалось записать лог в файл:", err);
    console.log(JSON.stringify(log, null, 2));
  }
};
