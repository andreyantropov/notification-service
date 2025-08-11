import swaggerJsDoc from "swagger-jsdoc";
import fs from "fs";
import path, { dirname } from "path";
import yaml from "js-yaml";
import { fileURLToPath } from "url";

const loadSchema = (filename: string): unknown => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const file = fs.readFileSync(
    path.join(__dirname, "./schemas", filename),
    "utf8",
  );

  return yaml.load(file);
};

const getSwaggerSpec = (options: { baseUrl: string }) => {
  const { baseUrl } = options;

  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Notification Service API",
        version: "1.0.0",
        description: "Документация API сервиса уведомлений",
      },
      servers: [
        {
          url: baseUrl,
        },
      ],
      components: {
        schemas: {
          BitrixRecipient: loadSchema("BitrixRecipient.yaml"),
          EmailRecipient: loadSchema("EmailRecipient.yaml"),
          Recipient: loadSchema("Recipient.yaml"),
          NotificationRequest: loadSchema("NotificationRequest.yaml"),
        },
      },
    },
    apis: ["./src/infrastructure/http/express/controllers/**/*.ts"],
  };

  return swaggerJsDoc(swaggerOptions);
};

export { getSwaggerSpec };
