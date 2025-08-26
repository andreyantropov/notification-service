const getSwaggerSpec = (options: { baseUrl: string }) => {
  const { baseUrl } = options;

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
        Notification: {
          type: "object",
          description: "Уведомление: содержит список получателей и сообщение",
          required: ["recipients", "message"],
          properties: {
            recipients: {
              type: "array",
              description: "Список получателей",
              minItems: 1,
              items: {
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
            },
            message: {
              type: "string",
              minLength: 1,
              example: "Ваш заказ готов!",
              description: "Текст уведомления",
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

        SendResponse: {
          type: "object",
          description: "Ответ при частичной обработке (207 Multi-Status)",
          properties: {
            message: {
              type: "string",
              example: "Уведомления частично отправлены",
              description:
                "Общее сообщение о результате: успех, частичная ошибка или полный провал",
            },
            totalCount: {
              type: "integer",
              example: 3,
              description: "Общее количество уведомлений в запросе",
            },
            successCount: {
              type: "integer",
              example: 1,
              description: "Количество успешно отправленных уведомлений",
            },
            validationErrorCount: {
              type: "integer",
              example: 1,
              description:
                "Количество уведомлений с ошибками валидации (ошибки клиента)",
            },
            deliveryErrorCount: {
              type: "integer",
              example: 1,
              description:
                "Количество уведомлений, которые не удалось отправить (ошибки сервера)",
            },
            details: {
              type: "array",
              description: "Детали по каждому уведомлению",
              items: {
                oneOf: [
                  {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        enum: ["success"],
                        example: "success",
                      },
                      notification: {
                        $ref: "#/components/schemas/Notification",
                      },
                    },
                    required: ["status", "notification"],
                    description: "Уведомление успешно отправлено",
                  },
                  {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        enum: ["error"],
                        example: "error",
                      },
                      notification: {
                        $ref: "#/components/schemas/Notification",
                      },
                      error: {
                        type: "string",
                        example: "Email service timeout",
                        description: "Описание ошибки на стороне сервера",
                      },
                    },
                    required: ["status", "notification"],
                    description: "Ошибка при отправке уведомления",
                  },
                  {
                    type: "object",
                    properties: {
                      status: {
                        type: "string",
                        enum: ["error"],
                        example: "error",
                      },
                      notification: {
                        type: "object",
                        description: "Сырой объект из запроса",
                        additionalProperties: true,
                      },
                      message: {
                        type: "string",
                        example:
                          "Некорректная структура уведомления. Исправьте данные и повторите запрос.",
                        description: "Рекомендация клиенту",
                      },
                      errors: {
                        type: "array",
                        description: "Ошибки валидации по стандарту Zod",
                        items: {
                          type: "object",
                          properties: {
                            code: {
                              type: "string",
                              example: "too_small",
                            },
                            message: {
                              type: "string",
                              example:
                                "List must contain at least 1 element(s)",
                            },
                            path: {
                              type: "array",
                              items: { type: "string" },
                              example: ["recipients"],
                            },
                          },
                        },
                      },
                    },
                    required: ["status", "notification", "message", "errors"],
                    description: "Уведомление не прошло валидацию",
                  },
                ],
              },
            },
          },
          required: [
            "message",
            "totalCount",
            "successCount",
            "validationErrorCount",
            "deliveryErrorCount",
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
            "Принимает одно уведомление или массив (от 1 до 100). Возвращает:\n" +
            "- 201: всё отправлено\n" +
            "- 207: частично (ошибки валидации или доставки)\n" +
            "- 400: ни одно не прошло валидацию\n" +
            "- 500: внутренняя ошибка",
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
                "Частичная обработка: некоторые уведомления не были отправлены из-за ошибок валидации или доставки.",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SendResponse",
                  },
                  examples: {
                    partialMixed: {
                      summary: "Ошибка валидации + ошибка доставки",
                      value: {
                        message: "Уведомления частично отправлены",
                        totalCount: 3,
                        successCount: 1,
                        validationErrorCount: 1,
                        deliveryErrorCount: 1,
                        details: [
                          {
                            status: "success",
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
                            status: "error",
                            notification: {
                              recipients: [],
                              message: "",
                            },
                            message:
                              "Некорректная структура уведомления. Исправьте данные и повторите запрос.",
                            errors: [
                              {
                                code: "too_small",
                                message:
                                  "List must contain at least 1 element(s)",
                                path: ["recipients"],
                              },
                            ],
                          },
                          {
                            status: "error",
                            notification: {
                              recipients: [
                                {
                                  type: "email",
                                  value: "slow@ok.com",
                                },
                              ],
                              message: "Wait",
                            },
                            error: "Email service timeout",
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
