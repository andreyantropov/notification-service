import { v4 as uuidv4 } from "uuid";
import Log from "../../interfaces/Log";
import { TriggerType } from "../../enum/TriggerType";
import { LogLevel } from "../../enum/LogLevel";
import { promises as fs } from "fs";
import path from "path";
import { writeLog as writeLogToDatabase } from "../influxdb/influxdb";

const INFLUXDB_MEASUREMENT = "isplanar-notification-logs";
const UNKNOWN_SERVICE = "UnknownService";

const getCallerServiceName = (callerService?: string): string => {
  return callerService || process.env.CALLER_SERVICE || UNKNOWN_SERVICE;
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
  return process.env.CURRENT_SERVICE || UNKNOWN_SERVICE;
};

const ensureLogDirectoryExists = async (): Promise<void> => {
  const logDir = path.join(process.cwd(), "logs");
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

const writeLogToFile = async (log: Log): Promise<void> => {
  await ensureLogDirectoryExists();
  const logDir = path.join(process.cwd(), "logs");
  const fileName = getLogFileName(log.tags.level, new Date());
  const filePath = path.join(logDir, fileName);

  await fs.writeFile(filePath, JSON.stringify(log, null, 2));
};

export const log = async (
  level: LogLevel,
  message: string,
  options: {
    callerService?: string;
    trigger?: TriggerType;
    payload?: any;
    error?: Error;
  } = {},
): Promise<void> => {
  const log: Log = {
    measurement: INFLUXDB_MEASUREMENT,
    timestamp: Date.now(),
    tags: {
      level,
      currentService: getCurrentServiceName(),
      trigger: getTriggerType(options.trigger),
      callerService: getCallerServiceName(options.callerService),
    },
    fields: {
      id: uuidv4(),
      message,
      durationMs: 0,
      ...(options.payload && { payload: JSON.stringify(options.payload) }),
      ...(options.error && { error: JSON.stringify(options.error) }),
    },
  };

  try {
    await writeLogToDatabase(log);
  } catch (error) {
    try {
      console.error("Не удалось записать лог в БД:", error);
      await writeLogToFile(log);
    } catch (error) {
      console.error("Не удалось записать лог в файл:", error);
      console.log(JSON.stringify(log, null, 2));
      return;
    }
  }
};
