# 📨 Notification Service

## Описание

Сервис **notification-service** предназначен для отправки транзакционных уведомлений пользователям через указанные каналы доставки.

Поддерживаемые каналы доставки:

- ✅ Bitrix24 (через REST API)
- ✅ Email (через SMTP)

> Сервис может быть расширен для поддержки SMS, Telegram, Push-уведомлений и других каналов.

В основе сервиса лежит фреймворк [Express.js](https://expressjs.com/) для построения HTTP API.

---

## Системные требования

Для корректной работы сервиса необходимы следующие зависимости:

| Компонент     | Версия / Требование                        |
| ------------- | ------------------------------------------ |
| Node.js       | v23.x или выше                             |
| npm           | v10.x или выше                             |
| Bitrix24      | Активный портал с настроенным webhook      |
| SMTP          | Настроенный SMTP-сервер для рассылки email |
| InfluxDB      | Для централизованного логирования          |
| opentelemetry | Для сбора трейсов                          |

---

## Зависимости проекта

### 🔧 Основные зависимости:

- [`express`](https://expressjs.com/) — веб-фреймворк для построения API
- [`axios`](https://axios-http.com/) — для HTTP-запросов к внешним API (Bitrix24 и др.)
- [`nodemailer`](https://nodemailer.com/) — для отправки email через SMTP
- [`influx`](https://www.npmjs.com/package/influx) — для интеграции с InfluxDB (опционально)
- [`awilix`](https://github.com/jeffijoe/awilix) — контейнер зависимостей (DI/IoC) для управления жизненным циклом сервисов
- [`opentelemetry`](https://opentelemetry.io/) — для сбора трейсов

### 🛠️ Инструменты разработки:

- [`typescript`](https://www.typescriptlang.org/)
- [`vitest`](https://vitest.dev/) — для написания юнит-тестов
- [`eslint`](https://eslint.org/) + [`prettier`](https://prettier.io/) — контроль качества и форматирование кода

---

## Переменные окружения (.env)

Создайте файл `.env` в корневой директории проекта со следующими параметрами:

### 🔧 Общие настройки сервера

```env
URL=http://localhost:3000/api
PORT=3000
```

### ⚙️ Rate Limiting

```env
RATE_LIMIT_PERIOD=60000
RATE_LIMIT_TRIES=100
```

### ⚙️ Graceful Shutdown

```env
GRACEFUL_SHUTDOWN_TIMEOUT=30000
```

### ⚙️ Настройки процесса отправки уведомлений

```env
PROCESS_BATCHING_INTERVAL=60000
```

### 📡 Bitrix24

```env
BITRIX_BASE_URL=https://bitrix24.planarchel.ru
BITRIX_API_URL=https://your-domain.bitrix24.ru/rest/
BITRIX_API_TOKEN=your_token_here
```

### 📧 Email (SMTP)

```env
SMTP_HOST=smtp.mail.ru
SMTP_PORT=587
SMTP_LOGIN=isp
SMTP_PASSWORD=masterkey
SMTP_EMAIL=isp-noreply@planarchel.ru
```

### 📊 Логирование (InfluxDB - опционально)

```env
INFLUXDB_URL=https://influxdb.example.com
INFLUXDB_TOKEN=your_influxdb_token
INFLUXDB_ORG=YourOrganization
INFLUXDB_BUCKET=notifications
```

### 🗂️ Логирование

```env
LOGS_DIR=logs
MEASUREMENT=notification_service_logs
SERVICE_NAME=notification-service
SERVICE_VERSION=1.0.0
```

---

## Установка и запуск

### 1. Установите зависимости

```bash
npm install
```

### 2. Доступные команды

| Команда                 | Описание                                     |
| ----------------------- | -------------------------------------------- |
| `npm run build`         | Компиляция TypeScript в JavaScript (`dist/`) |
| `npm run start`         | Запуск production-версии приложения          |
| `npm run dev`           | Режим разработки с авто-перезапуском         |
| `npm run prod`          | Полный цикл: сборка + запуск                 |
| `npm run lint`          | Проверка кода через ESLint                   |
| `npm run lint:fix`      | Исправление ошибок форматирования            |
| `npm run lint:format`   | Форматирование кода через Prettier           |
| `npm run test`          | Запуск юнит-тестов                           |
| `npm run test:coverage` | Отчет о покрытии тестами                     |

### 3. Примеры использования

#### Режим разработки

```bash
npm run dev
```

#### Production сборка и запуск

```bash
npm run prod
```

#### Запуск тестов

```bash
npm run test
```

---

## Запуск через Docker

```bash
./build.sh
./run.sh
```

---

## Документация

- [ADR/](./docs/adr/) — Architectural Decision Records (документация принятых решений)
- [ARCHITECTURE.md](./docs/architecture/architecture.md) — Описание архитектуры сервиса
- [ENVIRONMENT/](./docs/environment.md) — Описание среды развертывания
- [GUIDELINE/](./docs/guideline.md) — Описание правил и рекомендаций по оформлению кода
