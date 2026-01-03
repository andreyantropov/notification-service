# Telemetry

Набор утилит телеметрии для платформы уведомлений:  
структурированное логирование, распределённая трассировка и метрики на основе OpenTelemetry.

> ⚠️ **Этот пакет не запускает OpenTelemetry SDK.**  
> Он предоставляет **адаптеры поверх OpenTelemetry API**, которые должны быть инициализированы в хост-приложении.

## 📦 Содержимое

### 📝 Логирование
- **`createLogger`** — реализация `Logger` из `@notification-platform/shared`:
  - вывод в stdout через `winston`,
  - автоматическая сериализация ошибок (`serialize-error`),
  - автоматическое преобразование имён и атрибутов в `snake_case`,
  - экспорт в OpenTelemetry Logs через `@opentelemetry/winston-transport`,
  - унифицированный формат: `traceId`, `spanId`, `service.name`, `level`, `timestamp`.

### 🔍 Трассировка
- **`createTracer`** — реализация `Tracer` из `@notification-platform/shared`:
  - автоматическое преобразование имён и атрибутов в `snake_case`,
  - поддержка всех видов span'ов (`SERVER`, `CLIENT`, `PRODUCER` и т.д.),
  - обработка исключений и установка статуса спана.

### 📊 Метрики
- **`createMeter`** — реализация `Meter` из `@notification-platform/shared`:
  - поддержка счётчиков (`increment`) и гистограмм (`record`),
  - кэширование метрик по имени,
  - автоматическое преобразование меток в `snake_case`.

## 🧩 Требования

- **OpenTelemetry SDK** должен быть инициализирован в хост-приложении:
  ```ts
  import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
  import { NodeSDK } from '@opentelemetry/sdk-node';
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
  
  const sdk = new NodeSDK({ /* ... */ });
  sdk.start();
  ```
- Все компоненты используют **публичный OpenTelemetry API** (`@opentelemetry/api`), а не реализацию.

## 🚀 Использование

```ts
// В вашем сервисе
import { createLogger, createTracer, createMeter } from '@notification-platform/telemetry';
import { Logger, Tracer, Meter } from '@notification-platform/shared';

const logger: Logger = createLogger();
const tracer: Tracer = createTracer({ serviceName: 'notification-service' });
const meter: Meter = createMeter({ serviceName: 'notification-service' });

// Логирование
logger.info({
  message: 'Notification sent',
  eventType: 'notification_sent',
  details: { channelId: 'email' },
});

// Трассировка
await tracer.startActiveSpan('send_notification', { kind: 'PRODUCER' }, async (span) => {
  // ... логика отправки
});

// Метрики
meter.increment('notifications_processed_total', { channel: 'email' });
meter.record('channel_latency_ms', 150, { channel: 'email' });
```