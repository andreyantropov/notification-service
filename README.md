# isplanar-notification

## Описание

Сервис автоматической рассылки уведомлений пользователям ISPlanar через различные каналы связи:

- Bitrix24
- SMTP

Сервис проверяет очередь уведомлений в базе данных Firebird, определяет оптимальный канал доставки на основе доступных контактных данных пользователя, отправляет уведомления и удаляет успешно отправленные записи из очереди.

---

## Системные требования

Для корректной работы сервиса необходимы:

1. **Node.js**: v23.x или выше
2. **npm**: v10.x или выше
3. **СУБД Firebird**: v2.5/v3.x с настроенным доступом
4. **SMTP-сервер** для отправки email-уведомлений
5. **Bitrix24 REST API**: активный портал с настроенным webhook
6. **InfluxDB** для централизованного логирования (опционально)

---

## Переменные окружения (.env)

Создайте файл `.env` в корневой директории проекта со следующими параметрами:

### База данных Firebird

FIREBIRD_HOST=localhost # Хост базы данных
FIREBIRD_PORT=3050 # Порт подключения
FIREBIRD_DATABASE=/path/to/db.fdb # Путь к файлу базы данных
FIREBIRD_USER=sysdba # Имя пользователя
FIREBIRD_PASSWORD=masterkey # Пароль

### Настройки Bitrix24

BITRIX_API_URL=https://your-domain.bitrix24.ru/rest/ # URL API Bitrix
BITRIX_API_TOKEN=your_token_here # Webhook токен

### Настройки Email

SMTP_HOST=https://your-domain.mail.ru/rest/ # URI SMTP
SMTP_PORT=25 # Порт подключения
SMTP_LOGIN=isp # Имя пользователя
SMTP_PASSWORD=masterkey # Пароль
SMTP_EMAIL=isp-noreply@planarchel.ru # Данные об отправителе письма

### Логирование (опционально)

INFLUXDB_URL=https://influxdb.example.com # URL InfluxDB
INFLUXDB_TOKEN=your_influxdb_token # Токен доступа
INFLUXDB_ORG=YourOrganization # Организация
INFLUXDB_BUCKET=notifications # Bucket для хранения логов

### Метаданные сервиса

CURRENT_SERVICE=isplanar-notification # Имя текущего сервиса
CALLER_SERVICE=crontab # Вызывающий сервис (по умолчанию: unknown-service)
TRIGGER_TYPE=cron # Тип триггера (по умолчанию: manual)

---

## Установка и запуск

### 1. Установка зависимостей

```bash
npm install
```

### 2. Доступные команды (package.json scripts)

| Команда          | Описание                                                            |
| ---------------- | ------------------------------------------------------------------- |
| `npm run build`  | Компиляция TypeScript кода в JavaScript (результат в папке `dist`)  |
| `npm run start`  | Запуск скомпилированного приложения в production режиме             |
| `npm run dev`    | Запуск приложения в режиме разработки с автоматическим перезапуском |
| `npm run prod`   | Полный цикл: компиляция + запуск в production режиме                |
| `npm run lint`   | Проверка кода на соответствие правилам ESLint                       |
| `npm run fix`    | Автоматическое исправление простых ошибок форматирования            |
| `npm run format` | Форматирование кода с помощью Prettier                              |
| `npm run test`   | Запуск юнит-тестов                                                  |

### 3. Примеры использования

#### Режим разработки

```bash
npm run dev
```

Автоматически следит за изменениями в файлах `.ts` и перезапускает сервер.

#### Production сборка

```bash
npm run prod
```

Выполняет компиляцию TypeScript в JavaScript и запускает приложение.

#### Запуск тестов

```bash
npm run test
```

Запускает все юнит-тесты с использованием Jest.

---

## Запуск в Docker

Сервис можно запускать как напрямую через Node.js, так и в контейнеризованном виде с использованием Docker. Ниже приведены команды и инструкции для работы с контейнерами.

### 1. Сборка образа

```bash
./build.sh
```

> Образ будет сохранён локально под именем `isplanar-notification`.

---

### 2. Запуск контейнера в production режиме

```bash
./run.sh
```

Контейнер будет использовать переменные окружения из файла `.env`.  
Перед запуском убедитесь, что файл существует.

---

### 3. Запуск в режиме разработки

```bash
./run-dev.sh
```

Этот режим монтирует исходные файлы внутрь контейнера и запускает `npm run dev` с автоматическим перезапуском при изменении кода.

---

### 4. Остановка и очистка контейнера

```bash
./stop.sh
```

Контейнер будет остановлен и удалён, чтобы освободить имя для следующего запуска.

---

### 5. Просмотр логов

```bash
docker logs isplanar-notification
```

> Используйте `docker logs -f isplanar-notification`, чтобы следить за логами в реальном времени.

---

### 6. Сборка + запуск вручную (альтернатива скриптам)

```bash
docker build -t isplanar-notification .
docker run -d \
  --name isplanar-notification \
  --env-file .env \
  isplanar-notification
```

---

## Cron настройка

Рекомендуемый интервал запуска:

- не чаще, чем раз в секунду;
- не реже, чем раз в 10 минут.

Пример конфигурации crontab:

```bash
* * * * * for i in 0 10 20 30 40 50; do /path/to/your/command && sleep 10; done
```

## Дополнительные документы

- [ARCHITECTURE.md](./docs/architecture/architecture.md) — детальное описание архитектуры и слоёв
- [ADR](./docs/adr/) — Architectural Decision Records
