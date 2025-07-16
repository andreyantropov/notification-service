import { EventType } from "../../../application/services/notificationLoggerService/index.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { Server } from "./interfaces/Server.js";
import { ServerFabricConfig } from "./interfaces/ServerFabricConfig.js";

export const createDefaultServer = ({
  app,
  port,
  notificationLoggerService,
}: ServerFabricConfig): Server => {
  let server: ReturnType<typeof app.listen> | null = null;

  const start = () => {
    server = app.listen(port, async () => {
      await notificationLoggerService.writeLog({
        level: LogLevel.Debug,
        message: `HTTP-сервер успешно запущен на порту ${port}`,
        eventType: EventType.ServerSuccess,
        spanId: "createDefaultApp",
      });
      console.log(`Server running on port ${port}`);
      console.log(
        `Swagger docs available at http://localhost:${port}/api-docs`,
      );
    });
  };

  const stop = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (server) {
        server.close(async (err) => {
          if (err) {
            await notificationLoggerService.writeLog({
              level: LogLevel.Error,
              message: `Ошибка при остановке сервера: ${err.message}`,
              eventType: EventType.ServerError,
              spanId: "createDefaultApp",
            });
            return reject(err);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  return { start, stop };
};
