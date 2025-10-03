import { EventType } from "../../shared/enums/EventType.js";

export const start = async () => {
  const telemetrySDK = await import("../telemetry/telemetry.js");
  telemetrySDK.start();

  const { container } = await import("../container/container.js");

  const sendNotificationProcess = container.resolve("sendNotificationProcess");
  sendNotificationProcess.start();

  const server = container.resolve("server");
  await server.start();

  const loggerAdapter = container.resolve("loggerAdapter");
  await loggerAdapter.debug({
    message: "Приложение успешно запущено",
    eventType: EventType.Bootstrap,
  });
};
