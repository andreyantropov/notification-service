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
                { $ref: "#/components/schemas/Notification" },
                {
                  type: "object",
                  description:
                    "Сырой объект из запроса (если не прошёл валидацию)",
                  additionalProperties: true,
                },
              ],
            },
            error: {
              type: "object",
              description: "Ошибки валидации (Zod) или другие причины отказа",
              additionalProperties: true,
              example: [
                {
                  code: "too_small",
                  message: "List must contain at least 1 element(s)",
                  path: ["recipients"],
                },
              ],
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
              description: "Общее количество уведомлений в запросе",
            },
            validCount: {
              type: "integer",
              example: 2,
              description: "Количество уведомлений, прошедших валидацию",
            },
            invalidCount: {
              type: "integer",
              example: 1,
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
            },
            207: {
              description:
                "Частичная обработка: некоторые уведомления не прошли валидацию.",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SendResponse",
                  },
                  examples: {
                    partialValidation: {
                      summary: "Одно уведомление невалидно",
                      value: {
                        message:
                          "Уведомления приняты частично: 2 принято, 1 отклонено",
                        totalCount: 3,
                        validCount: 2,
                        invalidCount: 1,
                        details: [
                          {
                            success: true,
                            notification: {
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
                                message:
                                  "List must contain at least 1 element(s)",
                                path: ["recipients"],
                              },
                            ],
                          },
                        ],
                      },
                    },
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
                              description: "Ошибки валидации (Zod)",
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
                              },
                            },
                          },
                        },
                      },
                    },
                    required: ["error", "message", "details"],
                  },
                  examples: {
                    allInvalid: {
                      summary: "Все уведомления невалидны",
                      value: {
                        error: "HTTP 400 Bad Request",
                        message: "Ни одно уведомление не прошло валидацию",
                        details: [
                          {
                            item: { recipients: [], message: "" },
                            error: [
                              {
                                code: "too_small",
                                message:
                                  "List must contain at least 1 element(s)",
                                path: ["recipients"],
                              },
                            ],
                          },
                        ],
                      },
                    },
                  },
                },
              },
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
