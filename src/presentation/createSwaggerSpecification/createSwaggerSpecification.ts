import type { OpenAPIV3_1 } from "openapi-types";

import type { SwaggerSpecificationConfig } from "./interfaces/index.js";

export const createSwaggerSpecification = (
  config: SwaggerSpecificationConfig,
): OpenAPIV3_1.Document => {
  const { version, url, title, description } = config;

  return {
    openapi: "3.1.0",
    info: {
      title,
      version,
      description,
    },
    servers: [
      {
        url,
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

        IncomingNotification: {
          type: "object",
          description: "Уведомление, передаваемое клиентом",
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
              example: "Hello World!",
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

        Notification: {
          type: "object",
          description:
            "Уведомление с серверными метаданными (возвращается в ответе)",
          required: ["id", "createdAt", "contacts", "message"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
              description: "Уникальный идентификатор, сгенерированный сервером",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2025-11-09T12:57:25.938Z",
              description: "Время создания в формате ISO 8601",
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
              example: "Hello World!",
            },
            isImmediate: {
              type: "boolean",
              example: true,
            },
            strategy: {
              type: "string",
              enum: ["send_to_first_available", "send_to_all_available"],
              example: "send_to_first_available",
            },
            subject: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  example: "user-123",
                  description: "Идентификатор отправителя (из JWT)",
                },
                name: {
                  type: "string",
                  example: "John Doe",
                  description: "Имя отправителя (опционально)",
                },
              },
              required: ["id"],
              description: "Информация об отправителе",
            },
          },
        },

        NotificationRequestBody: {
          description:
            "Тело запроса: может быть одним уведомлением или массивом уведомлений (от 1 до 100)",
          oneOf: [
            {
              $ref: "#/components/schemas/IncomingNotification",
            },
            {
              type: "array",
              items: {
                $ref: "#/components/schemas/IncomingNotification",
              },
              minItems: 1,
              maxItems: 100,
            },
          ],
        },

        NotificationResponseBody: {
          type: "object",
          description: "Полный ответ на запрос обработки уведомлений",
          required: [
            "message",
            "totalCount",
            "acceptedCount",
            "rejectedCount",
            "details",
          ],
          properties: {
            message: {
              type: "string",
              example: "Все уведомления приняты в обработку",
            },
            totalCount: {
              type: "integer",
              minimum: 0,
              example: 2,
            },
            acceptedCount: {
              type: "integer",
              minimum: 0,
              example: 2,
            },
            rejectedCount: {
              type: "integer",
              minimum: 0,
              example: 0,
            },
            details: {
              type: "array",
              items: {
                oneOf: [
                  {
                    type: "object",
                    required: ["status", "notification"],
                    properties: {
                      status: {
                        type: "string",
                        enum: ["success"],
                      },
                      notification: {
                        $ref: "#/components/schemas/Notification",
                      },
                    },
                    additionalProperties: false,
                  },
                  {
                    type: "object",
                    required: ["status", "notification", "error"],
                    properties: {
                      status: {
                        type: "string",
                        enum: ["failure"],
                      },
                      notification: {
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
                              items: {
                                oneOf: [{ type: "string" }, { type: "number" }],
                              },
                            },
                            expected: { type: "string" },
                            received: { type: "string" },
                          },
                          required: ["code", "message", "path"],
                        },
                      },
                    },
                    additionalProperties: false,
                  },
                ],
              },
            },
          },
        },
      },
    },
    paths: {
      "/v1/notifications": {
        post: {
          summary: "Отправка уведомления",
          description:
            "Принимает одно уведомление или массив (от 1 до 100).\n\n" +
            "Уведомления с `isImmediate: true` отправляются немедленно. Остальные — буферизуются и отправляются пачкой.\n\n" +
            "**Важно:** API не возвращает статус доставки, только подтверждение приёма уведомлений в обработку.\n\n",
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
                  $ref: "#/components/schemas/NotificationRequestBody",
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
                      message: "Hello World!",
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
                        message: "Hello World!",
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
              description: "Все уведомления приняты в обработку",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/NotificationResponseBody",
                  },
                  example: {
                    message: "Все уведомления приняты в обработку",
                    totalCount: 2,
                    acceptedCount: 2,
                    rejectedCount: 0,
                    details: [
                      {
                        status: "success",
                        notification: {
                          id: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
                          createdAt: "2025-11-09T12:57:25.938Z",
                          contacts: [
                            {
                              type: "email",
                              value: "user1@example.com",
                            },
                          ],
                          message: "Hello World!",
                          isImmediate: true,
                          subject: {
                            id: "user-123",
                            name: "John Doe",
                          },
                        },
                      },
                      {
                        status: "success",
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
              description: "Частичная обработка",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/NotificationResponseBody",
                  },
                  example: {
                    message:
                      "Уведомления приняты частично: 2 принято, 1 отклонено",
                    totalCount: 3,
                    acceptedCount: 2,
                    rejectedCount: 1,
                    details: [
                      {
                        status: "success",
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
                        status: "failure",
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
                        status: "success",
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
              description: "Ни одно уведомление не прошло валидацию",
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
            401: {
              description:
                "Отсутствует, недействителен или просрочен JWT-токен.",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: {
                        type: "string",
                      },
                      message: {
                        type: "string",
                      },
                    },
                    required: ["error", "message"],
                  },
                  example: {
                    error: "HTTP 401 Unauthorized",
                    message:
                      "Требуется действительный JWT-токен для доступа к ресурсу",
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
            504: {
              description: "Таймаут обработки запроса",
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
                    error: "HTTP 504 Gateway Timeout",
                    message: "Превышено время ожидания обработки запроса",
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
