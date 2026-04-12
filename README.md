# 📨 Notification Service

Сервис отправки транзакционных уведомлений через каналы **Bitrix24** и **Email**.  
Реализует гибкую доставку на основе стратегий: принимает массив контактов получателя и единое сообщение, гарантируя доставку согласно заданному критерию (`strategy`).

> 🔌 Легко расширяем: новые каналы (SMS, Telegram и др.) подключаются через общий интерфейс.

### ⚙️ Стратегии доставки

Поведение при отправке в несколько каналов:

- `send_to_first_available` — отправка прекращается после успеха в **первом** доступном канале.
- `send_to_any_available` — успех, если доставлено **хотя бы в один** доступный канал; ошибка, если все неудачны.
- `send_to_all_available` — успех, если уведомление доставлено **по всем** доступным каналам; ошибка, если хотя бы по одному каналу отправить уведомление не удалось.

> 📘 С полным описанием доступных стратегий вы можете ознакомиться в документе [strategies.md](./docs/architecture/strategies.md).

---

## ⚙️ Системные требования

| Компонент          | Требование                   |
| ------------------ | ---------------------------- |
| **Node.js**        | v23.x или выше               |
| **npm**            | v9.x или выше                |
| **Bitrix24**       | Активный портал с REST API   |
| **SMTP**           | Настроенный SMTP-сервер      |
| **OTel Collector** | Для телеметрии (опционально) |

---

## 📄 Конфигурация

Все параметры задаются через переменные окружения.  
Полный список с описанием, обязательностью и значениями по умолчанию — в файле:  
👉 [.env.example](./.env.example)

```bash
cp .env.example .env
# Отредактируйте .env под ваше окружение
```

---

## 🚀 Быстрый старт

```bash
npm install
npm run build
npm run start
```

---

## ▶️ Основные команды

| Команда                 | Описание                                      |
| ----------------------- | --------------------------------------------- |
| `npm run dev`           | Запуск в режиме разработки (.env.dev)         |
| `npm run build`         | Сборка TypeScript-кода в директорию `dist/`   |
| `npm run start`         | Запуск production-версии из `dist/index.js`   |
| `npm run test`          | Запуск unit- и интеграционных тестов (Vitest) |
| `npm run test:coverage` | Запуск тестов с генерацией отчёта о покрытии  |
| `npm run lint`          | Проверка кода с помощью ESLint                |
| `npm run lint:fix`      | Автоисправление ошибок линтера                |
| `npm run lint:format`   | Форматирование кода с помощью Prettier        |

---

## 📡 API

Все запросы требуют заголовок `Authorization: Bearer <token>`.

### Одиночное уведомление

```http
POST /api/v1/notifications
Content-Type: application/json

{
  "contacts": [
    { "type": "bitrix", "value": 4582 },
    { "type": "email", "value": "user@company.com" }
  ],
  "message": "Заказ #123 готов"
}
```

### Пакетная отправка (до 50 шт.)

```http
POST /api/v1/notifications/batch
Content-Type: application/json

[
  {
    "contacts": [{ "type": "email", "value": "admin@company.com" }],
    "message": "Отчет сформирован"
  },
  {
    "contacts": [{ "type": "bitrix", "value": 101 }],
    "message": "Требуется согласование",
    "strategy": "send_to_all_available"
  }
]
```

---

## 🩺 Healthcheck

Сервис предоставляет стандартные эндпоинты для оркестраторов:

- **Liveness**: `GET /health/live` — процесс жив.
- **Readiness**: `GET /health/ready` — все зависимости доступны.

Используйте в `livenessProbe` / `readinessProbe` Kubernetes.

---

## 🐳 Docker

Сервис можно запустить в Docker-контейнере.  
Подробная инструкция по сборке, запуску и управлению — в документе [docker.md](./docs/docker.md).

---

## 📚 Документация

- [ADR (Architectural Decision Records)](./docs/adr/)
- [Архитектура](./docs/architecture/architecture.md)
- [Соглашения по коду](./docs/guideline.md)
