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

   > 🔸 В этом проекте управление жизненным циклом вынесено в отдельный слой `lifecycle/`, который **запускает и завершает** Composition Root.

5. **Изоляция от доменной логики**  
   В этом слое **нет бизнес-правил** — только конфигурация и проводка.

6. **Ранняя инициализация глобальных инструментов**  
   Например: настройка OpenTelemetry пропагатора **до** создания контейнера — это критично для корректного трейсинга.

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

| Принцип                          | Объяснение                                                                                                                                              |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅ **Единственное место сборки** | Все зависимости создаются только здесь. Нигде в коде **не должно быть** `new BitrixSender()` или прямых вызовов фабрик без DI.                          |
| ✅ **Инверсия управления (IoC)** | Высокоуровневые модули (use cases) не зависят от низкоуровневых реализаций — они получают их через параметры.                                           |
| ✅ **Изоляция от домена**        | Composition Root не содержит логики вроде _"если задача просрочена, то..."_. Он только связывает готовые кирпичики.                                     |
| ✅ **Тестируемость**             | Благодаря DI легко подменить зависимости при тестировании (например, использовать `MockSender` вместо `BitrixSender`).                                  |
| ✅ **Ленивая инициализация**     | Контейнер и зависимости загружаются **динамически** при запуске, что позволяет контролировать порядок инициализации (например, телеметрия → контейнер). |

---

## Реализация в проекте

Composition Root реализован через **Awilix-контейнер**, зарегистрированный в `src/container/`, но **инициализируется лениво** через слой **Lifecycle**.

### Структура:

```
composition/
├── bootstrap.ts                 → Запуск приложения
├── container/
│   ├── container.ts             → createContainer<Container>()
│   ├── infrastructure/          → адаптеры (логгер, буфер, HTTP-клиенты)
│   └── application/             → use cases, сервисы, фоновые процессы
├── lifecycle/
│   ├── start.ts                 → запускает телеметрию → импортирует контейнер → стартует процессы
│   └── shutdown.ts              → корректно завершает зависимости в обратном порядке
└── telemetry/
    └── telemetry.ts             → инициализация OpenTelemetry (включая monkey-patching через setGlobalPropagator)
```

> 🔸 **Важно**:
>
> - `telemetry.ts` **не является частью Awilix**, но **логически входит в Composition Root**, так как настраивает глобальное состояние до создания контейнера.
> - Контейнер **не импортируется статически** в `bootstrap.ts` — это сделано для контроля порядка инициализации.

---

## Точка входа

```ts
// src/bootstrap.ts
export const bootstrap = async () => {
  const { start } = await import("./lifecycle/start.js");
  await start();

  // настройка graceful shutdown → вызывает lifecycle/shutdown
};
```

А внутри `lifecycle/start.ts`:

```ts
// lifecycle/start.ts
export const start = async () => {
  const telemetry = await import("../telemetry/telemetry.js");
  telemetry.start(); // ← monkey-patching OpenTelemetry

  const { container } = await import("../container/container.js"); // ← Composition Root
  // ... запуск сервера и процессов
};
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
    subgraph Bootstrap [Точка входа]
        bootstrap -->|вызывает| Lifecycle
    end

    subgraph Lifecycle [Lifecycle Layer]
        start -->|инициализирует| Telemetry
        start -->|динамически импортирует| CompositionRoot
        shutdown -->|завершает в обратном порядке| CompositionRoot
    end

    subgraph CompositionRoot [Composition Root (Awilix)]
        Telemetry[OpenTelemetry\n(setGlobalPropagator)] --> Container
        Container --> Infrastructure
        Infrastructure --> Application
        Application --> Presentation
        Presentation --> Server
    end

    Domain -->|Определяет интерфейсы| Infrastructure
    Domain -->|Используется| Application
```

---

## Преимущества такого подхода

- **Контроль порядка инициализации**: телеметрия → контейнер → зависимости.
- **Гибкость**: легко заменить канал доставки или стратегию логирования.
- **Тестируемость**: в тестах — `MockBuffer`, в проде — `InMemoryBuffer`.
- **Читаемость**: вся "проводка" сосредоточена в одном месте.
- **Поддерживаемость**: зависимости не "размазаны" по коду.
- **Безопасность для OpenTelemetry**: monkey-patching происходит **до** любых HTTP-вызовов.
