import { type OpenAPIV3_1 } from "openapi-types";

import pkg from "../../../package.json" with { type: "json" };

import { type SwaggerSpecificationConfig } from "./interfaces/index.js";

export const createSwaggerSpecification = (
  config: SwaggerSpecificationConfig,
): OpenAPIV3_1.Document => {
  const { url, title } = config;

  return {
    openapi: "3.1.0",
    info: {
      title,
      version: pkg.version,
      description: pkg.description,
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
          description: "JWT-токен для аутентификации и авторизации",
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
          description: "Данные для создания уведомления",
          required: ["contacts", "message"],
          properties: {
            contacts: {
              type: "array",
              description: "Список контактов получателя (минимум один)",
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
          description: "Объект созданного уведомления",
          required: ["id", "createdAt", "contacts", "message", "initiator"],
          properties: {
            id: {
              type: "string",
              format: "uuid",
              example: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
              description: "Уникальный идентификатор уведомления",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              example: "2026-03-06T12:57:25.938Z",
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
            strategy: {
              type: "string",
              enum: [
                "send_to_first_available",
                "send_to_any_available",
                "send_to_all_available",
              ],
              example: "send_to_first_available",
            },
            initiator: {
              type: "object",
              description: "Информация об инициаторе (отправителе) уведомления",
              required: ["id", "name"],
              properties: {
                id: {
                  type: "string",
                  example: "user-123",
                  description: "Уникальный идентификатор пользователя из JWT",
                },
                name: {
                  type: "string",
                  example: "John Doe",
                  description: "Имя пользователя",
                },
              },
            },
          },
        },

        NotificationResult: {
          oneOf: [
            {
              type: "object",
              description: "Успешно обработанное уведомление",
              required: ["status", "payload"],
              properties: {
                status: {
                  type: "string",
                  enum: ["success"],
                },
                payload: {
                  $ref: "#/components/schemas/Notification",
                },
              },
              additionalProperties: false,
            },
            {
              type: "object",
              description: "Ошибка обработки уведомления",
              required: ["status", "error"],
              properties: {
                status: {
                  type: "string",
                  enum: ["client_error", "server_error"],
                },
                error: {
                  type: "object",
                  required: ["message"],
                  properties: {
                    message: {
                      type: "string",
                      example: "Уведомление не прошло валидацию",
                    },
                    details: {
                      type: "object",
                      description: "Дополнительные детали ошибки",
                      additionalProperties: true,
                    },
                  },
                },
              },
              additionalProperties: false,
            },
          ],
        },

        NotificationResultBatch: {
          type: "object",
          description: "Результат пакетной обработки уведомлений",
          required: ["message", "payload"],
          properties: {
            message: {
              type: "string",
              example: "Все уведомления приняты в обработку",
            },
            summary: {
              type: "object",
              required: ["total", "accepted", "rejected"],
              properties: {
                total: {
                  type: "integer",
                  example: 5,
                },
                accepted: {
                  type: "integer",
                  example: 4,
                },
                rejected: {
                  type: "integer",
                  example: 1,
                },
              },
            },
            payload: {
              type: "array",
              items: {
                $ref: "#/components/schemas/NotificationResult",
              },
            },
          },
        },

        ErrorResponse: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
            },
            details: {
              type: "object",
              additionalProperties: true,
            },
          },
        },
      },
    },
    paths: {
      "/v1/notifications": {
        post: {
          summary: "Отправка одиночного уведомления",
          description:
            "Отправляет уведомление указанному получателю.\n" +
            "Возвращает результат отправки с подтверждением доставки или ошибкой.",
          tags: ["Notifications"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/IncomingNotification",
                },
                examples: {
                  email: {
                    summary: "Email уведомление",
                    value: {
                      contacts: [
                        {
                          type: "email",
                          value: "user@example.com",
                        },
                      ],
                      message: "Приветик через Интернетик!",
                      strategy: "send_to_first_available",
                    },
                  },
                  bitrix: {
                    summary: "Bitrix24 уведомление",
                    value: {
                      contacts: [
                        {
                          type: "bitrix",
                          value: 42,
                        },
                      ],
                      message: "Приветик через Интернетик!",
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Уведомление успешно отправлено",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Notification",
                  },
                  example: {
                    id: "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8",
                    createdAt: "2026-03-06T12:57:25.938Z",
                    contacts: [
                      {
                        type: "email",
                        value: "user@example.com",
                      },
                    ],
                    message: "Ваш заказ готов к выдаче.",
                    strategy: "send_to_first_available",
                    initiator: {
                      id: "user-123",
                      name: "John Doe",
                    },
                  },
                },
              },
            },
            400: {
              description: "Ошибка валидации входных данных",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                  example: {
                    message: "Уведомление не прошло валидацию",
                    details: {
                      issues: [
                        {
                          code: "too_small",
                          path: ["contacts"],
                          message: "Список контактов не может быть пустым",
                        },
                      ],
                    },
                  },
                },
              },
            },
            401: {
              description: "Неавторизованный запрос",
              content: {
                "application/json": {
                  example: {
                    message: "Unauthorized",
                  },
                },
              },
            },
            403: {
              description: "Доступ запрещен (недостаточно прав)",
              content: {
                "application/json": {
                  example: {
                    message: "Forbidden",
                  },
                },
              },
            },
            500: {
              description: "Внутренняя ошибка сервера",
              content: {
                "application/json": {
                  example: {
                    message: "Internal Server Error",
                  },
                },
              },
            },
          },
        },
      },
      "/v1/notifications/batch": {
        post: {
          summary: "Пакетная отправка уведомлений",
          description:
            "Отправляет пакет уведомлений (до 50 шт.). Каждое уведомление отправляется синхронно.\n" +
            "Возвращает детальный отчет по каждому элементу пакета: успешно доставлено или ошибка.",
          tags: ["Notifications"],
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/IncomingNotification",
                  },
                  minItems: 1,
                  maxItems: 50,
                },
                examples: {
                  mixedBatch: {
                    summary: "Смешанный пакет",
                    value: [
                      {
                        contacts: [{ type: "email", value: "ok@example.com" }],
                        message: "Валидное уведомление.",
                      },
                      {
                        contacts: [],
                        message: "Невалидное уведомление.",
                      },
                      {
                        contacts: [{ type: "bitrix", value: 999 }],
                        message:
                          "Валидное уведомление с указанием стратегии отправки.",
                        strategy: "send_to_all_available",
                      },
                    ],
                  },
                },
              },
            },
          },
          responses: {
            202: {
              description: "Все уведомления в пакете успешно отправлены",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/NotificationResultBatch",
                  },
                  example: {
                    message: "Все уведомления приняты в обработку",
                    summary: {
                      total: 2,
                      accepted: 2,
                      rejected: 0,
                    },
                    payload: [
                      {
                        status: "success",
                        payload: {
                          id: "uuid-1",
                          createdAt: "2026-03-06T12:00:00.000Z",
                          contacts: [
                            { type: "email", value: "ok@example.com" },
                          ],
                          message: "Success item",
                          initiator: { id: "user-123", name: "John Doe" },
                        },
                      },
                      {
                        status: "success",
                        payload: {
                          id: "uuid-2",
                          createdAt: "2026-03-06T12:00:00.001Z",
                          contacts: [{ type: "bitrix", value: 999 }],
                          message: "Another success",
                          strategy: "send_to_all_available",
                          initiator: { id: "user-123", name: "John Doe" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            207: {
              description:
                "Часть уведомлений не прошла валидацию или вызвала ошибку",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/NotificationResultBatch",
                  },
                  example: {
                    message: "Не удалось обработать некоторые уведомления",
                    summary: {
                      total: 3,
                      accepted: 2,
                      rejected: 1,
                    },
                    payload: [
                      {
                        status: "success",
                        payload: {
                          id: "uuid-1",
                          createdAt: "2026-03-06T12:00:00.000Z",
                          contacts: [
                            { type: "email", value: "ok@example.com" },
                          ],
                          message: "Success item",
                          initiator: { id: "user-123", name: "John Doe" },
                        },
                      },
                      {
                        status: "client_error",
                        error: {
                          message: "Уведомление не прошло валидацию",
                          details: {
                            issues: [
                              {
                                code: "too_small",
                                path: ["contacts"],
                                message:
                                  "Список контактов не может быть пустым",
                              },
                            ],
                          },
                        },
                      },
                      {
                        status: "success",
                        payload: {
                          id: "uuid-3",
                          createdAt: "2026-03-06T12:00:00.002Z",
                          contacts: [{ type: "bitrix", value: 999 }],
                          message: "Another success",
                          initiator: { id: "user-123", name: "John Doe" },
                        },
                      },
                    ],
                  },
                },
              },
            },
            400: {
              description:
                "Ошибка структуры запроса (например, превышен лимит пакета)",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ErrorResponse",
                  },
                  example: {
                    message:
                      "Размер пакета уведомлений выходит за допустимые пределы",
                    details: {
                      limit: 50,
                      received: 105,
                    },
                  },
                },
              },
            },
            401: {
              description: "Неавторизованный запрос",
              content: {
                "application/json": {
                  example: { message: "Unauthorized" },
                },
              },
            },
            403: {
              description: "Доступ запрещен",
              content: {
                "application/json": {
                  example: { message: "Forbidden" },
                },
              },
            },
            500: {
              description: "Внутренняя ошибка сервера",
              content: {
                "application/json": {
                  example: { message: "Internal Server Error" },
                },
              },
            },
          },
        },
      },
    },
  };
};
