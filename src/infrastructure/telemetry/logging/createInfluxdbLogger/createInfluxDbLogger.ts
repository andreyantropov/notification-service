import { InfluxDB, Point } from "@influxdata/influxdb-client";

import { InfluxDbLoggerConfig } from "./interfaces/InfluxDbLoggerConfig.js";
import { Log } from "../interfaces/Log.js";
import { Logger } from "../interfaces/Logger.js";
import { InfluxDbLog } from "./interfaces/InfluxDbLog.js";
import { toSnakeCase } from "../../../../shared/utils/toSnakeCase/toSnakeCase.js";

const NS_MULTIPLIER = 1_000_000;

export const createInfluxDbLogger = (config: InfluxDbLoggerConfig): Logger => {
  const { url, token, org, bucket, measurement } = config;

  const client = new InfluxDB({
    url: url,
    token: token,
  });

  const mapper = (log: Log): InfluxDbLog => {
    return {
      measurement,
      timestamp: log.timestamp * NS_MULTIPLIER,
      tags: {
        level: log.level,
        serviceName: log.serviceName,
        serviceVersion: log.serviceVersion,
        trigger: log.trigger,
        environment: log.environment,
        eventType: log.eventType,
        host: log.host,
      },
      fields: {
        id: log.id,
        message: log.message,
        durationMs: log.durationMs,
        traceId: log.traceId,
        spanId: log.spanId,
        details: log.details,
        error: log.error,
      },
    };
  };

  const writeLog = async (log: Log): Promise<void> => {
    const { measurement, timestamp, tags, fields } = mapper(log);
    const writeApi = client.getWriteApi(org, bucket);

    try {
      const point = new Point().measurement(measurement).timestamp(timestamp);

      for (const [key, value] of Object.entries(tags)) {
        if (value !== undefined) {
          point.tag(toSnakeCase(key), String(value));
        }
      }

      for (const [key, value] of Object.entries(fields)) {
        if (value !== undefined) {
          if (typeof value === "number") {
            point.floatField(toSnakeCase(key), value);
          } else {
            point.stringField(toSnakeCase(key), String(value));
          }
        }
      }

      writeApi.writePoint(point);
    } catch (error) {
      throw new Error("Не удалось записать данные в influxDB", {
        cause: error,
      });
    } finally {
      await writeApi.close();
    }
  };

  return {
    writeLog,
  };
};
