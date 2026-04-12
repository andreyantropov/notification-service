import { SeverityNumber } from "@opentelemetry/api-logs";
import {
  type LogRecordProcessor,
  type SdkLogRecord,
} from "@opentelemetry/sdk-logs";

import { LOG_LEVEL } from "../../../createLogger/index.js";

export class CustomLogProcessor implements LogRecordProcessor {
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  onEmit(logRecord: SdkLogRecord): void {
    const attributes = logRecord.attributes;

    if (logRecord.severityText === LOG_LEVEL.FATAL) {
      logRecord.severityText = LOG_LEVEL.FATAL;
      logRecord.severityNumber = SeverityNumber.FATAL;
    }

    if (attributes["level"] === LOG_LEVEL.TRACE) {
      logRecord.severityText = LOG_LEVEL.TRACE;
      logRecord.severityNumber = SeverityNumber.TRACE;
    }

    if (attributes["eventName"]) {
      const eventName = attributes["eventName"] as string;
      logRecord.eventName = eventName;

      delete attributes["eventName"];
    }
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
}
