# Composition Root: сборка приложения

**Composition Root** — это единственное место в приложении, где происходит **сборка всех компонентов** и **инъекция зависимостей**. Здесь абстракции получают свои реализации: интерфейсы связываются с конкретными классами, конфигурации применяются, и формируется готовое приложение.

> 💡 Это не бизнес-логика, а **архитектурный каркас**, который "оживляет" приложение, соединяя слои: домен, приложение и инфраструктуру.

---

## Основные задачи Composition Root

1. **Создание конкретных реализаций**  
   Например: `BitrixSender`, `SmtpSender`, `InfluxDbLogger`, `InMemoryBuffer`.

2. **Инъекция зависимостей**  
   Передача реализованных сервисов в use cases, контроллеры и процессы (например, `sendNotificationUseCase` получает `buffer`, `logger`, `sender`).

3. **Настройка взаимодействия между слоями**  
   Например: подключение fallback-логгера, настройка рейт-лимита, выбор стратегии доставки.

4. **Управление жизненным циклом (lifecycle)**  
   Обеспечение, что логгеры, буферы и серверы создаются как синглтоны и корректно переиспользуются.

5. **Изоляция от доменной логики**  
   В этом слое **нет бизнес-правил** — только конфигурация и проводка.

---

## Используемый инструмент: Awilix

Для реализации Composition Root используется библиотека **[Awilix](https://github.com/jeffijoe/awilix)** — легковесный DI-контейнер для Node.js.

> ✅ Awilix позволяет:
>
> - Регистрировать зависимости как `singleton` или `transient`,
> - Автоматически внедрять зависимости по имени,
> - Создавать чистую, тестируемую архитектуру без ручной инъекции.

```ts
container.register({
  loggerAdapter: asFunction(createLoggerAdapter).singleton(),
  sendNotificationUseCase: asFunction(
    createSendNotificationUseCase,
  ).singleton(),
});
```

---

## Ключевые принципы

| Принцип                          | Объяснение                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ✅ **Единственное место сборки** | Все зависимости создаются только здесь. Нигде в коде **не должно быть** `new BitrixSender()` или прямых вызовов фабрик без DI. |
| ✅ **Инверсия управления (IoC)** | Высокоуровневые модули (use cases) не зависят от низкоуровневых реализаций — они получают их через параметры.                  |
| ✅ **Изоляция от домена**        | Composition Root не содержит логики вроде _"если задача просрочена, то..."_. Он только связывает готовые кирпичики.            |
| ✅ **Тестируемость**             | Благодаря DI легко подменить зависимости при тестировании (например, использовать `MockSender` вместо `BitrixSender`).         |
| ✅ **Модульность**               | Контейнер разбит на логические части (`infrastructure/`, `application/`), что упрощает поддержку.                              |

---

## Реализация в проекте

В этом проекте Composition Root реализован через **Awilix-контейнер**, зарегистрированный в `src/container/`.

### Структура:

```
src/container/
├── container.ts                 → createContainer<Container>()
├── infrastructure/
│   ├── logger.container.ts
│   ├── counter.container.ts
│   ├── buffer.container.ts
│   └── http.container.ts
├── application/
│   ├── useCases.container.ts
│   ├── services.container.ts
│   └── jobs.container.ts
└── index.ts                     → регистрирует всё и экспортирует `container`
```

### Точка входа:

```ts
// src/index.ts
import { container } from "./container";

const server = container.resolve("server");
server.start();
```

---

## Пример: регистрация use case

```ts
// container/application/useCases.container.ts
container.register({
  sendNotificationUseCase: asFunction(
    ({ buffer, notificationDeliveryService, loggerAdapter }) =>
      createSendNotificationUseCase(
        buffer,
        notificationDeliveryService,
        loggerAdapter,
      ),
  ).singleton(),
});
```

👉 Use case получает все зависимости **через DI**, а не создавая их напрямую.

---

## Архитектурная схема

```mermaid
flowchart TB
    subgraph CompositionRoot [Composition Root (Awilix)]
        direction TB
        Config[Конфигурации] -->|Инъекция| Infrastructure
        Infrastructure[Инфраструктурные адаптеры\n(Bitrix, SMTP, Logger, Buffer)] --> Application
        Application[Application Layer\n(Use Cases, Services)] --> Presentation
        Presentation[HTTP Controllers & Middleware]
        Presentation --> Server[Express Server]
    end

    Domain -->|Определяет интерфейсы| Infrastructure
    Domain -->|Используется| Application
    Application -->|Управляется| CompositionRoot
```

### Пояснение:

- **Domain** — определяет интерфейсы (`NotificationSender`, `Logger`).
- **Infrastructure** — предоставляет реализации.
- **Application** — содержит use cases и сервисы.
- **Presentation** — HTTP-контроллеры и middleware.
- **Composition Root** — всё это соединяет с помощью DI.

---

## Преимущества такого подхода

- **Гибкость**: можно легко заменить канал доставки или стратегию логирования.
- **Тестируемость**: в тестах — `MockBuffer`, в проде — `InMemoryBuffer`.
- **Читаемость**: вся "проводка" сосредоточена в одном месте.
- **Поддерживаемость**: зависимости не "размазаны" по коду.
- **Масштабируемость**: легко добавлять новые модули (например, `worker.container.ts` для фоновых задач).
