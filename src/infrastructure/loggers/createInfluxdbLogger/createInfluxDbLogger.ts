import { InfluxDB, Point } from "@influxdata/influxdb-client";
import { InfluxDbLoggerConfig } from "./interfaces/InfluxDbLoggerConfig.js";
import { toSnakeCase } from "../../../shared/utils/toSnakeCase/toSnakeCase.js";
import { Log } from "../../../application/ports/Log.js";
import { Logger } from "../../../application/ports/Logger.js";

export const createInfluxDbLogger = ({
  url,
  token,
  org,
  bucket,
}: InfluxDbLoggerConfig): Logger => {
  const client = new InfluxDB({
    url: url,
    token: token,
  });

  const writeLog = async ({
    measurement,
    timestamp,
    tags,
    fields,
  }: Log): Promise<void> => {
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
