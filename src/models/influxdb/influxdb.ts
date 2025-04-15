import { InfluxDB, Point } from "@influxdata/influxdb-client";
import Log from "../../interfaces/Log";
import { mapKeysToSnakeCase } from "../../utils/snake-case-mapper/to-snake-case";

const org = process.env.INFLUXDB_ORG;
const bucket = process.env.INFLUXDB_BUCKET;

const client = new InfluxDB({
  url: process.env.INFLUXDB_URL,
  token: process.env.INFLUXDB_TOKEN,
});

export const writeLog = async ({
  measurement,
  timestamp,
  tags,
  fields,
}: Log): Promise<void> => {
  const writeApi = client.getWriteApi(org, bucket);

  const mappedTags = mapKeysToSnakeCase(tags);
  const mappedFields = mapKeysToSnakeCase(fields);

  const point = new Point()
    .measurement(measurement)
    .timestamp(timestamp)
    .tag("level", tags.level)
    .tag("current_service", mappedTags.current_service)
    .tag("caller_service", mappedTags.caller_service)
    .tag("trigger", tags.trigger)
    .tag("environment", tags.environment)
    .tag("event_type", mappedTags.event_type)
    .tag("host", tags.host)
    .floatField("duration_ms", mappedFields.duration_ms)
    .stringField("id", fields.id)
    .stringField("message", fields.message)
    .stringField("trace_id", mappedFields.trace_id)
    .stringField("correlation_id", mappedFields.correlation_id)
    .stringField("span_id", mappedFields.span_id)
    .stringField("payload", fields.payload)
    .stringField("error", fields.error);

  writeApi.writePoint(point);
  await writeApi.close();
};
