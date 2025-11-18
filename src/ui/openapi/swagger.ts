const getSwagger = (config: { baseUrl: string }) => {
  const { baseUrl } = config;

  return {
    openapi: "3.0.0",
    info: {
      title: "Notification Service API",
      version: "1.0.0",
      description: "API для отправки уведомлений.",
    },
    servers: [
      {
        url: baseUrl,
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT-токен",
        },
      },
      schemas: {
        Contact: {
          oneOf: [
            {
              type: "object",
              required: ["type", "value"],
              properties: {
                type: {
                  type: "string",
                  enum: ["email"],
                  example: "email",
                },
                value: {
                  type: "string",
                  format: "email",
                  example: "user@example.com",
                },
              },
              description: "Email-получатель",
            },
            {
              type: "object",
              required: ["type", "value"],
              properties: {
                type: {
                  type: "string",
                  enum: ["bitrix"],
                  example: "bitrix",
                },
                value: {
                  type: "integer",
                  example: 123456,
                },
              },
              description: "Получатель в Bitrix24 по ID",
            },
          ],
          discriminator: {
            propertyName: "type",
          },
        },

        Notification: {
          type: "object",
          description:
            "Уведомление: содержит список контактов одного получателя, сообщение и опциональный флаг isImmediate",
          required: ["contacts", "message"],
          properties: {
            contacts: {
              type: "array",
              description: "Список контактов одного получателя (минимум один)",
              minItems: 1,
              items: {
                $ref: "#/components/schemas/Contact",
              },
            },
            message: {
              type: "string",
              minLength: 1,
              example: "Ваш заказ готов!",
              description: "Текст уведомления",
            },
            isImmediate: {
              type: "boolean",
              default: false,
              example: true,
              description:
                "Если true — уведомление отправляется немедленно. Если false или отсутствует — попадает в буфер и отправляется пачкой.",
            },
            strategy: {
              type: "string",
              enum: ["send_to_first_available", "send_to_all_available"],
              description: "Стратегия доставки уведомления",
              example: "send_to_first_available",
            },
          },
        },

        NotificationRequest: {
          description:
            "Тело запроса: может быть одним уведомлением или массивом уведомлений (от 1 до 100)",
          oneOf: [
            {
              $ref: "#/components/schemas/Notification",
            },
            {
              type: "array",
              items: {
                $ref: "#/components/schemas/Notification",
              },
              minItems: 1,
              maxItems: 100,
            },
          ],
        },

        NotificationResponse: {
          type: "object",
          description:
            "Уведомление с серверным ID и временной меткой создания (возвращается в ответе)",
          required: ["id", "createdAt", "contacts", "message"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
              description:
                "Уникальный идентификатор уведомления, сгенерированный сервером",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-11-09T12:57:25.938Z",
              description: "Время создания уведомления в формате ISO 8601",
            },
            contacts: {
              type: "array",
              minItems: 1,
              items: {
                $ref: "#/components/schemas/Contact",
              },
            },
            message: {
              type: "string",
              example: "Ваш заказ готов!",
            },
            isImmediate: {
              type: "boolean",
              example: true,
            },
            strategy: {
              type: "string",
              enum: ["send_to_first_available", "send_to_all_available"],
              description: "Стратегия доставки уведомления",
              example: "send_to_first_available",
            },
            subject: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  example: "user-123",
                  description: "Идентификатор отправителя (обычно из JWT)",
                },
                name: {
                  type: "string",
                  example: "John Doe",
                  description: "Имя отправителя (опционально)",
                },
              },
              required: ["id"],
              description: "Информация об отправителе уведомления",
            },
          },
        },

        Receipt: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
              description:
                "true — уведомление принято в обработку, false — не прошло валидацию",
            },
            notification: {
              oneOf: [
                {
                  $ref: "#/components/schemas/NotificationResponse",
                  description: "Валидное уведомление с серверным ID",
                },
                {
                  type: "object",
                  description:
                    "Сырой объект из запроса (если не прошёл валидацию)",
                  additionalProperties: true,
                },
              ],
            },
            error: {
              type: "array",
              description: "Ошибки валидации (Zod) при success: false",
              items: {
                type: "object",
                properties: {
                  code: {
                    type: "string",
                    example: "too_small",
                  },
                  message: {
                    type: "string",
                    example: "List must contain at least 1 element(s)",
                  },
                  path: {
                    type: "array",
                    items: {
                      type: ["string", "number"],
                    },
                    example: ["contacts"],
                  },
                  expected: { type: "string" },
                  received: { type: "string" },
                },
                required: ["code", "message", "path"],
              },
            },
          },
          required: ["success", "notification"],
        },

        ReceiptBatch: {
          type: "object",
          description: "Ответ при частичной обработке (207 Multi-Status)",
          properties: {
            message: {
              type: "string",
              example: "Уведомления приняты частично: 2 принято, 1 отклонено",
              description: "Сообщение о результате обработки запроса",
            },
            totalCount: {
              type: "integer",
              example: 3,
              minimum: 0,
              description: "Общее количество уведомлений в запросе",
            },
            acceptedCount: {
              type: "integer",
              example: 2,
              minimum: 0,
              description: "Количество уведомлений, принятых в обработку",
            },
            rejectedCount: {
              type: "integer",
              example: 1,
              minimum: 0,
              description:
                "Количество уведомлений, отклонённых из-за ошибок валидации",
            },
            details: {
              type: "array",
              description: "Результат обработки каждого уведомления",
              items: {
                $ref: "#/components/schemas/Receipt",
              },
            },
          },
          required: [
            "message",
            "totalCount",
            "acceptedCount",
            "rejectedCount",
            "details",
          ],
        },
      },
    },
    paths: {
      "/health/live": {
        get: {
          summary: "Liveness проверка",
          description: "Проверяет, запущен ли сервис.",
          tags: ["Healthcheck"],
          responses: {
            200: { description: "OK" },
          },
        },
      },
      "/health/ready": {
        get: {
          summary: "Readiness проверка",
          description: "Проверяет, готов ли сервис принимать запросы.",
          tags: ["Healthcheck"],
          responses: {
            200: { description: "Готов" },
            503: { description: "Не готов" },
          },
        },
      },
      "/v1/notifications": {
        post: {
          summary: "Отправка уведомления",
          description:
            "Принимает одно уведомление или массив (от 1 до 100). Уведомления с `isImmediate: true` отправляются немедленно. Остальные — буферизуются и отправляются пачкой.\n\n" +
            "**Важно:** API не возвращает статус доставки, только подтверждение приёма уведомлений в обработку.\n\n" +
            "Возвращает:\n" +
            "- `202`: все уведомления валидны и приняты в обработку\n" +
            "- `207`: часть уведомлений не прошла валидацию\n" +
            "- `400`: ни одно не прошло валидацию\n" +
            "- `500`: внутренняя ошибка",
          tags: ["Notifications"],
          security: [
            {
              BearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/NotificationRequest",
                },
                examples: {
                  single: {
                    summary: "Одно срочное уведомление",
                    value: {
                      contacts: [
                        {
                          type: "email",
                          value: "user@example.com",
                        },
                      ],
                      message: "Срочное: заказ отправлен!",
                      isImmediate: true,
                    },
                  },
                  batch: {
                    summary: "Пачка уведомлений (срочные и несрочные)",
                    value: [
                      {
                        contacts: [
                          {
                            type: "email",
                            value: "user1@example.com",
                          },
                        ],
                        message: "Ваш заказ готов",
                        isImmediate: true,
                      },
                      {
                        contacts: [
                          {
                            type: "bitrix",
                            value: 123456,
                          },
                        ],
                        message: "Напоминание о встрече",
                        isImmediate: false,
                      },
                    ],
                  },
                },
              },
            },
          },
          responses: {
            202: {
              description:
                "Все уведомления приняты в обработку (включая буферизацию)",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ReceiptBatch",
                  },
                  example: {
                    message: "Все уведомления приняты в обработку",
                    totalCount: 2,
                    acceptedCount: 2,
                    rejectedCount: 0,
                    details: [
                      {
                        success: true,
                        notification: {
                          id: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
                          createdAt: "2025-11-09T12:57:25.938Z",
                          contacts: [
                            {
                              type: "email",
                              value: "user1@example.com",
                            },
                          ],
                          message: "Ваш заказ готов",
                          isImmediate: true,
                          subject: {
                            id: "user-123",
                            name: "John Doe",
                          },
                        },
                      },
                      {
                        success: true,
                        notification: {
                          id: "b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o9",
                          contacts: [
                            {
                              type: "bitrix",
                              value: 123456,
                            },
                          ],
                          message: "Напоминание о встрече",
                          isImmediate: false,
                          subject: {
                            id: "user-123",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            207: {
              description:
                "Частичная обработка: некоторые уведомления не прошли валидацию.",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ReceiptBatch",
                  },
                  example: {
                    message:
                      "Уведомления приняты частично: 2 принято, 1 отклонено",
                    totalCount: 3,
                    acceptedCount: 2,
                    rejectedCount: 1,
                    details: [
                      {
                        success: true,
                        notification: {
                          id: "c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p0",
                          createdAt: "2025-11-09T12:57:25.938Z",
                          contacts: [
                            {
                              type: "email",
                              value: "ok@ok.com",
                            },
                          ],
                          message: "Hi",
                          subject: {
                            id: "user-123",
                          },
                        },
                      },
                      {
                        success: false,
                        notification: {
                          contacts: [],
                          message: "",
                        },
                        error: [
                          {
                            code: "too_small",
                            message: "List must contain at least 1 element(s)",
                            path: ["contacts"],
                          },
                        ],
                      },
                      {
                        success: true,
                        notification: {
                          id: "d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0q1",
                          contacts: [
                            {
                              type: "email",
                              value: "another@ok.com",
                            },
                          ],
                          message: "Hello again",
                          subject: {
                            id: "user-123",
                            name: "Jane Smith",
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description:
                "Ни одно уведомление не прошло валидацию. Ответ содержит список невалидных элементов.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                        example: "HTTP 400 Bad Request",
                      },
                      message: {
                        type: "string",
                        example: "Ни одно уведомление не прошло валидацию",
                      },
                      details: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            item: {
                              type: "object",
                              description: "Сырой объект из запроса",
                              additionalProperties: true,
                            },
                            error: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  code: { type: "string" },
                                  message: { type: "string" },
                                  path: {
                                    type: "array",
                                    items: { type: "string" },
                                  },
                                },
                                required: ["code", "message", "path"],
                              },
                            },
                          },
                          required: ["item", "error"],
                        },
                      },
                    },
                    required: ["error", "message", "details"],
                  },
                  example: {
                    error: "HTTP 400 Bad Request",
                    message: "Ни одно уведомление не прошло валидацию",
                    details: [
                      {
                        item: { contacts: [], message: "" },
                        error: [
                          {
                            code: "too_small",
                            message: "List must contain at least 1 element(s)",
                            path: ["contacts"],
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
            500: {
              description: "Внутренняя ошибка сервера",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string" },
                      message: { type: "string" },
                    },
                    required: ["error", "message"],
                  },
                  example: {
                    error: "HTTP 500 Internal Server Error",
                    message: "Не удалось отправить уведомление",
                  },
                },
              },
            },
          },
        },
      },
    },
  };
};

export { getSwagger };
