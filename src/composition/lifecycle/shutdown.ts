import { EventType } from "../../shared/enums/EventType.js";

export const shutdown = async () => {
  const { container } = await import("../container/container.js");

  const server = container.resolve("server");
  await server.shutdown();

  const sendNotificationProcess = container.resolve("sendNotificationProcess");
  sendNotificationProcess.stop();

  const telemetrySDK = await import("../telemetry/telemetry.js");
  await telemetrySDK.shutdown();

  const loggerAdapter = container.resolve("loggerAdapter");
  await loggerAdapter.debug({
    message: "Приложение корректно завершило работу",
    eventType: EventType.Shutdown,
  });
};
