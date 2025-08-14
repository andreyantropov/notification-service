const getSwaggerSpec = (options: { baseUrl: string }) => {
  const { baseUrl } = options;

  return {
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
        BitrixRecipient: {
          type: "object",
          description: "Получатель уведомления в системе Bitrix24",
          required: ["type", "value"],
          properties: {
            type: {
              type: "string",
              enum: ["bitrix"],
              example: "bitrix",
              description: "Тип получателя — bitrix",
            },
            value: {
              type: "integer",
              format: "int64",
              example: 123456,
              description: "ID пользователя в Bitrix24",
            },
          },
        },
        EmailRecipient: {
          type: "object",
          description: "Получатель уведомления по электронной почте",
          required: ["type", "value"],
          properties: {
            type: {
              type: "string",
              enum: ["email"],
              example: "email",
              description: "Тип получателя — email",
            },
            value: {
              type: "string",
              format: "email",
              example: "user@example.com",
              description: "Email-адрес получателя",
            },
          },
        },
        Recipient: {
          description:
            "Дискриминированный union: может быть либо email, либо Bitrix24 пользователь",
          oneOf: [
            { $ref: "#/components/schemas/EmailRecipient" },
            { $ref: "#/components/schemas/BitrixRecipient" },
          ],
          discriminator: {
            propertyName: "type",
            mapping: {
              email: "#/components/schemas/EmailRecipient",
              bitrix: "#/components/schemas/BitrixRecipient",
            },
          },
        },
        NotificationRequest: {
          type: "object",
          description:
            "Запрос, содержащий список получателей и текст сообщения",
          required: ["recipients", "message"],
          properties: {
            recipients: {
              description: "Список получателей уведомления",
              type: "array",
              items: {
                $ref: "#/components/schemas/Recipient",
              },
            },
            message: {
              type: "string",
              example: "Ваше уведомление прибыло!",
              description: "Сообщение уведомления",
            },
          },
        },
      },
    },
    paths: {
      "/health/live": {
        get: {
          summary: "Liveness проверка сервиса",
          description: "Проверяет, запущен ли сервис и работает ли он.",
          tags: ["Healthcheck"],
          responses: {
            200: {
              description: "Сервис жив",
            },
          },
        },
      },
      "/health/ready": {
        get: {
          summary: "Readiness проверка сервиса",
          description:
            "Проверяет, готов ли сервис принимать запросы. Выполняет проверку зависимостей (если они есть).",
          tags: ["Healthcheck"],
          responses: {
            200: {
              description: "Сервис готов к работе",
            },
            503: {
              description: "Сервис временно недоступен",
            },
          },
        },
      },
      "/v1/notifications": {
        post: {
          summary: "Отправка уведомления",
          tags: ["Notifications"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NotificationRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Уведомление успешно отправлено",
            },
            400: {
              description: "Некорректное тело запроса",
            },
            500: {
              description: "Внутренняя ошибка сервера",
            },
          },
        },
      },
    },
  };
};

export { getSwaggerSpec };
