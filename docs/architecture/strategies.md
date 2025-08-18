# 📦 Стратегии доставки уведомлений

Этот документ описывает **доступные стратегии доставки уведомлений** в сервисе `notification-service`.  
Стратегии определяют **логику отправки сообщений** через доступные каналы (например, Bitrix24, Email), позволяя гибко настраивать поведение системы без изменения её ядра.

Стратегии реализуют интерфейс `DeliveryStrategy` и могут быть легко заменены или расширены.

---

## 🧩 Общая концепция

Сервис поддерживает **гибкие стратегии доставки**, которые:

- Принимают список `NotificationSender` (каналы доставки)
- Получают уведомление (`recipients`, `message`)
- Управляют порядком и условиями отправки
- Возвращают `Promise<void>` — успех или ошибка

```ts
type DeliveryStrategy = (
  senders: NotificationSender[],
  notification: Notification,
  onError: (
    payload: { recipient: Recipient; message: string },
    error: Error,
  ) => void,
) => Promise<void>;
```

Стратегии позволяют реализовать разные политики:

- Отправить первому доступному
- Отправить всем подходящим
- Отправить по приоритету
- Отправить с повторными попытками

---

## 1. `sendToFirstAvailableStrategy`

### 🎯 Назначение

Отправить уведомление **первому получателю, которому удалось доставить сообщение**, и завершить процесс.

> Аналог: "fallback-цепочка" — попробовать Bitrix → если не получилось, попробовать Email → если и это не сработало — ошибка.

---

### 🔍 Как работает

1. Для каждого получателя:
   - Фильтруем каналы, которые поддерживают его тип (`isSupports(recipient)`)
   - Пытаемся отправить через каждый канал **по очереди**
   - При **успехе** — завершаем стратегию (уведомление считается доставленным)
2. Если **ни одному** получателю не удалось доставить — выбрасываем ошибку

> ⚠️ Отправка **прекращается после первого успешного канала**.

---

### 📈 Диаграмма последовательности

```mermaid
sequenceDiagram
    participant Service as NotificationService
    participant Strategy as sendToFirstAvailable
    participant Sender1 as BitrixSender
    participant Sender2 as SmtpSender
    participant User as Пользователь

    Service->>Strategy: send(senders, { recipients, message })
    Strategy->>Strategy: recipients[0] = { type: "bitrix", value: "123" }

    Strategy->>Sender1: isSupports(recipient)?
    Sender1-->>Strategy: true
    Strategy->>Sender1: send(recipient, message)
    Sender1-->>Strategy: Ошибка (404)

    Strategy->>Sender2: isSupports(recipient)?
    Sender2-->>Strategy: true
    Strategy->>Sender2: send(recipient, message)
    Sender2-->>Strategy: Успех (200)

    Strategy-->>Service: Успешно
    Service->>User: HTTP 201 Created
```

---

### ✅ Когда использовать

- **Приоритет на основной канал** (например, Bitrix24), резервный — Email
- Нужно **минимизировать количество отправок**
- Уведомление достаточно доставить **хотя бы одним способом**
- Типичные сценарии:
  - Уведомление о просроченной задаче
  - Смена статуса задачи
  - Назначение ответственного

---

### 🧪 Пример использования

```ts
const service = createNotificationDeliveryService(
  [bitrixSender, smtpSender],
  sendToFirstAvailableStrategy,
);

await service.send({
  recipients: [
    { type: "bitrix", value: "12345" },
    { type: "email", value: "user@company.com" },
  ],
  message: "Ваша задача просрочена",
});
```

> Результат: попытка через Bitrix → при ошибке → попытка через Email → при успехе — отправка завершена.

---

## 2. `sendToAllAvailableStrategy`

### 🎯 Назначение

Отправить уведомление **всем получателям по всем подходящим каналам** параллельно.  
Уведомление считается доставленным, если **хотя бы один канал** успешно отправил.

> Аналог: "broadcast" — отправить всем, кто может получить.

---

### 🔍 Как работает

1. Для каждого получателя:
   - Определяем все каналы, которые его поддерживают
   - Запускаем отправку **параллельно** через все подходящие каналы
2. Ждём завершения всех попыток
3. Если **все попытки провалились** — выбрасываем ошибку

> ⚠️ Отправка **не прерывается** после первого успеха — пытаемся отправить всем.

---

### 📈 Диаграмма последовательности

```mermaid
sequenceDiagram
    participant Service as NotificationService
    participant Strategy as sendToAllAvailable
    participant Bitrix as BitrixSender
    participant Smtp as SmtpSender
    participant User as Пользователь

    Service->>Strategy: send(senders, { recipients, message })

    Strategy->>Strategy: Обработка recipients[0]

    Strategy->>Bitrix: isSupports()? → true
    Strategy->>Smtp: isSupports()? → true

    Strategy->>Bitrix: send() -- параллельно
    Strategy->>Smtp: send() -- параллельно

    Bitrix-->>Strategy: Ошибка
    Smtp-->>Strategy: Успех

    Strategy-->>Service: Успешно (хотя бы один)
    Service->>User: HTTP 201 Created
```

---

### ✅ Когда использовать

- Нужно **максимально повысить вероятность получения** уведомления
- Важные события, где **дублирование допустимо**
- Уведомления для **администраторов или ответственных лиц**
- Примеры:
  - Критическое падение системы
  - Создание нового проекта с участием нескольких команд
  - Уведомление о смене владельца задачи

---

### 🧪 Пример использования

```ts
const service = createNotificationDeliveryService(
  [bitrixSender, smtpSender],
  sendToAllAvailableStrategy,
);

await service.send({
  recipients: [{ type: "bitrix", value: "12345" }],
  message: "Система перешла в режим обслуживания",
});
```

> Результат: попытка отправки через Bitrix **и** через Email (если оба поддерживают тип), даже если один уже сработал.

---

## 🧰 Как создать свою стратегию

Ты можешь легко добавить новую стратегию, реализовав интерфейс `DeliveryStrategy`.

### Пример: `sendWithRetryStrategy`

```ts
import { DeliveryStrategy } from "./types/DeliveryStrategy.js";

const withRetry = async <T>(
  fn: () => Promise<T>,
  retries: number,
): Promise<T> => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

export const sendWithRetryStrategy: DeliveryStrategy = async (
  senders,
  { recipients, message },
  onError,
) => {
  for (const recipient of recipients) {
    const supported = senders.filter((s) => s.isSupports(recipient));
    await withRetry(
      () => sendToRecipient(recipient, message, supported, onError),
      3,
    );
  }
};
```

> Такую стратегию можно комбинировать с другими паттернами (retry, circuit breaker и т.д.).

---

## 🧩 Возможные стратегии (идеи для будущего)

| Стратегия                | Описание                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| `priorityBasedStrategy`  | Отправка по приоритету каналов (например, Telegram > Email > SMS) |
| `broadcastToAllStrategy` | Отправить всем, даже если дублируется                             |
| `conditionalStrategy`    | Выбор стратегии по условию (время суток, тип уведомления)         |
| `delayedStrategy`        | Отложить отправку на N минут                                      |
| `samplingStrategy`       | Отправлять только части пользователей (для A/B тестов)            |

---

## 📌 Выводы

| Стратегия                      | Когда использовать        | Отправляет        |
| ------------------------------ | ------------------------- | ----------------- |
| `sendToFirstAvailableStrategy` | Основной канал + fallback | Первому успешному |
| `sendToAllAvailableStrategy`   | Максимальная доставка     | Всем подходящим   |

- Легко **расширяются** и **тестируются**
- Поддерживают **гибкую конфигурацию** через DI

> 💡 Подсказка: стратегия выбирается при создании сервиса и **не меняется во время выполнения**. Для динамического выбора используй обёртку-фабрику.
