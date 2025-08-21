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
        Notification: {
          type: "object",
          description: "Уведомление: содержит список получателей и сообщение",
          required: ["recipients", "message"],
          properties: {
            recipients: {
              description: "Список получателей уведомления",
              type: "array",
              items: {
                $ref: "#/components/schemas/Recipient",
              },
              minItems: 1,
            },
            message: {
              type: "string",
              example: "Ваше уведомление прибыло!",
              description: "Сообщение уведомления",
              minLength: 1,
            },
          },
        },
        NotificationRequest: {
          description:
            "Тело запроса: может быть одним уведомлением или массивом уведомлений (от 1 до 100)",
          oneOf: [
            { $ref: "#/components/schemas/Notification" },
            {
              type: "array",
              items: { $ref: "#/components/schemas/Notification" },
              minItems: 1,
              maxItems: 100,
            },
          ],
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
          summary: "Отправка уведомления (одного или пачкой)",
          tags: ["Notifications"],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NotificationRequest",
                },
                examples: {
                  single: {
                    summary: "Одно уведомление",
                    value: {
                      recipients: [
                        {
                          type: "email",
                          value: "user@example.com",
                        },
                      ],
                      message: "Привет! Это тестовое уведомление.",
                    },
                  },
                  batch: {
                    summary: "Пачка уведомлений",
                    value: [
                      {
                        recipients: [
                          {
                            type: "email",
                            value: "user1@example.com",
                          },
                        ],
                        message: "Первое уведомление",
                      },
                      {
                        recipients: [
                          {
                            type: "bitrix",
                            value: 123456,
                          },
                        ],
                        message: "Второе уведомление",
                      },
                    ],
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: "Все уведомления успешно отправлены",
            },
            207: {
              description:
                "Частичная отправка: не все уведомления были доставлены",
            },
            400: {
              description:
                "Некорректное тело запроса (невалидная структура или пустой массив)",
            },
            500: {
              description:
                "Внутренняя ошибка сервера (например, ошибка подключения к БД)",
            },
          },
        },
      },
    },
  };
};

export { getSwaggerSpec };
