const getSwaggerSpec = (config: { baseUrl: string }) => {
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
      schemas: {
        Recipient: {
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
            "Уведомление: содержит список контактов одного получателя, сообщение и опциональный флаг isUrgent",
          required: ["recipients", "message"],
          properties: {
            recipients: {
              type: "array",
              description: "Список контактов одного получателя (минимум один)",
              minItems: 1,
              items: {
                $ref: "#/components/schemas/Recipient",
              },
            },
            message: {
              type: "string",
              minLength: 1,
              example: "Ваш заказ готов!",
              description: "Текст уведомления",
            },
            isUrgent: {
              type: "boolean",
              default: false,
              example: true,
              description:
                "Если true — уведомление отправляется немедленно. Если false или отсутствует — попадает в буфер и отправляется пачкой.",
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
          description: "Уведомление с серверным ID (возвращается в ответе)",
          required: ["id", "recipients", "message"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
              description:
                "Уникальный идентификатор уведомления, сгенерированный сервером",
            },
            recipients: {
              type: "array",
              minItems: 1,
              items: {
                $ref: "#/components/schemas/Recipient",
              },
            },
            message: {
              type: "string",
              example: "Ваш заказ готов!",
            },
            isUrgent: {
              type: "boolean",
              example: true,
            },
          },
        },

        SendResult: {
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
                    example: ["recipients"],
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

        SendResponse: {
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
            validCount: {
              type: "integer",
              example: 2,
              minimum: 0,
              description: "Количество уведомлений, прошедших валидацию",
            },
            invalidCount: {
              type: "integer",
              example: 1,
              minimum: 0,
              description: "Количество уведомлений, не прошедших валидацию",
            },
            details: {
              type: "array",
              description: "Результат обработки каждого уведомления",
              items: {
                $ref: "#/components/schemas/SendResult",
              },
            },
          },
          required: [
            "message",
            "totalCount",
            "validCount",
            "invalidCount",
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
            "Принимает одно уведомление или массив (от 1 до 100). Уведомления с `isUrgent: true` отправляются немедленно. Остальные — буферизуются и отправляются пачкой.\n\n" +
            "**Важно:** API не возвращает статус доставки, только результат валидации.\n\n" +
            "Возвращает:\n" +
            "- `202`: все уведомления валидны и приняты в обработку\n" +
            "- `207`: часть уведомлений не прошла валидацию\n" +
            "- `400`: ни одно не прошло валидацию\n" +
            "- `500`: внутренняя ошибка",
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
                    summary: "Одно срочное уведомление",
                    value: {
                      recipients: [
                        {
                          type: "email",
                          value: "user@example.com",
                        },
                      ],
                      message: "Срочное: заказ отправлен!",
                      isUrgent: true,
                    },
                  },
                  batch: {
                    summary: "Пачка уведомлений (срочные и несрочные)",
                    value: [
                      {
                        recipients: [
                          {
                            type: "email",
                            value: "user1@example.com",
                          },
                        ],
                        message: "Ваш заказ готов",
                        isUrgent: true,
                      },
                      {
                        recipients: [
                          {
                            type: "bitrix",
                            value: 123456,
                          },
                        ],
                        message: "Напоминание о встрече",
                        isUrgent: false,
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
                    $ref: "#/components/schemas/SendResponse",
                  },
                  example: {
                    message: "Все уведомления приняты в обработку",
                    totalCount: 2,
                    validCount: 2,
                    invalidCount: 0,
                    details: [
                      {
                        success: true,
                        notification: {
                          id: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
                          recipients: [
                            {
                              type: "email",
                              value: "user1@example.com",
                            },
                          ],
                          message: "Ваш заказ готов",
                          isUrgent: true,
                        },
                      },
                      {
                        success: true,
                        notification: {
                          id: "b2c3d4e5-f6g7-8901-h2i3-j4k5l6m7n8o9",
                          recipients: [
                            {
                              type: "bitrix",
                              value: 123456,
                            },
                          ],
                          message: "Напоминание о встрече",
                          isUrgent: false,
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
                    $ref: "#/components/schemas/SendResponse",
                  },
                  example: {
                    message:
                      "Уведомления приняты частично: 2 принято, 1 отклонено",
                    totalCount: 3,
                    validCount: 2,
                    invalidCount: 1,
                    details: [
                      {
                        success: true,
                        notification: {
                          id: "c3d4e5f6-g7h8-9012-i3j4-k5l6m7n8o9p0",
                          recipients: [
                            {
                              type: "email",
                              value: "ok@ok.com",
                            },
                          ],
                          message: "Hi",
                        },
                      },
                      {
                        success: false,
                        notification: {
                          recipients: [],
                          message: "",
                        },
                        error: [
                          {
                            code: "too_small",
                            message: "List must contain at least 1 element(s)",
                            path: ["recipients"],
                          },
                        ],
                      },
                      {
                        success: true,
                        notification: {
                          id: "d4e5f6g7-h8i9-0123-j4k5-l6m7n8o9p0q1",
                          recipients: [
                            {
                              type: "email",
                              value: "another@ok.com",
                            },
                          ],
                          message: "Hello again",
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
                        item: { recipients: [], message: "" },
                        error: [
                          {
                            code: "too_small",
                            message: "List must contain at least 1 element(s)",
                            path: ["recipients"],
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

export { getSwaggerSpec };
