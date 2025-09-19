# 🧑‍💻 Гайдлайн по стилю и неймингу

> Этот документ описывает общие принципы написания кода в проекте.  
> ESLint, Prettier и TypeScript уже настроены — гайдлайн дополняет их там, где автоматика не справляется.  
> Цель — единообразие, читаемость и предсказуемость.

---

## 📦 Импорты

- Группируй импорты в следующем порядке:
  1. Внешние библиотеки (если есть)
  2. Локальные типы и интерфейсы
  3. Константы, enums, утилиты
  4. Абстракции и зависимости (порты, адаптеры и т.п.)
- Сортируй импорты **внутри групп** по алфавиту.
- Используй **явные расширения файлов** (`.js`).

✅ Пример:

```ts
import { ServerConfig } from "./interfaces/ServerConfig.js";
import { LogLevel } from "../../../shared/enums/LogLevel.js";
import { noop } from "../../../shared/utils/noop.js";
```

---

## 🏷️ Нейминг

### 📌 Общие правила

- Используй **camelCase** для переменных, функций, параметров:  
  `isActive`, `getUserData`, `notificationList`
- Используй **PascalCase** для типов, интерфейсов, классов:  
  `UserProps`, `NotificationService`, `DeliveryStrategy`
- Используй **UPPER_CASE** для констант (особенно если они используются как настройки, таймауты, ключи):  
  `MAX_RETRY_COUNT`, `DEFAULT_PORT`, `EMPTY_MESSAGE`

### 🏭 Фабричные функции

- Начинай с `create*`, если функция создаёт и возвращает объект с методами:  
  `createLogger`, `createServer`, `createApiClient`
- Принимай параметры **объектами**: `dependencies`, `config` — даже если параметр один.
- Необязательные параметры задавай через деструктуризацию со значениями по умолчанию **внутри функции**, а не в сигнатуре (если это не конфиг).

✅ Пример:

```ts
export const createSomething = (
  dependencies: SomethingDependencies,
  config: SomethingConfig = DEFAULT_CONFIG,
) => {
  const { adapter, logger = DEFAULT_LOGGER } = dependencies;
  const { timeout = 5000 } = config;
  // ...
};
```

### 🧩 Глобальные/синглтон-инстансы

- Начинай с `get*Instance`, если функция возвращает существующий или единственный инстанс:  
  `getLoggerInstance`, `getConfigInstance`

### 🧮 Чистые функции

- Называй глаголом в camelCase: `calculateTotal`, `validateEmail`, `formatDate`
- Передавай параметры **в плоском виде**, если это не конфигурация или группа зависимостей.

✅ Пример:

```ts
function add(a: number, b: number): number {
  return a + b;
}
```

---

## 💡 Структура функций

### 1. Деструктуризация и валидация

- В начале функции — деструктуризация параметров.

### 2. Инициализация состояния

- Локальное состояние (`let isBusy = false`, `let cache = null`) — объявляй сразу после деструктуризации.

### 3. Реализация методов

- Методы внутри фабрик — объявляй как константы: `const start = () => { ... }`
- Асинхронные методы — помечай `async`, даже если `await` не используется сразу.
- Избегай вложенности — выноси логику в отдельные внутренние функции, если она сложная.

### 4. Возврат API

- Возвращай объект с методами: `{ start, stop }`, `{ send, checkHealth }`
- Условные методы добавляй через spread:  
  `...(checkHealth ? { checkHealth } : {})`

---

## ⚠️ Обработка ошибок

- Оборачивай потенциально опасные операции в `try/catch`.
- В `catch` — **логируй ошибку** и/или пробрасывай дальше, если это уместно.
- В `finally` — **сбрасывай флаги состояния** (`isLoading = false`, `isProcessing = false`).
- Не глотай ошибки без логирования.
- Для асинхронных операций над массивами используй `Promise.allSettled`, если нужно игнорировать частичные ошибки.

✅ Пример:

```ts
try {
  await doSomething();
} catch (error) {
  logger.writeLog({ level: LogLevel.Error, message: "Failed", error });
  throw error; // или return { success: false, error }
} finally {
  isProcessing = false;
}
```

---

## 🧩 Типизация

- Все параметры, возвращаемые значения, структуры — **строго типизируй**.
- Интерфейсы и типы выноси в отдельные файлы (обычно в папке `interfaces/` или рядом с модулем).
- Не используй `any` — если тип неизвестен, используй `unknown` и делай проверки.
- Для функций-колбэков, стратегий, обработчиков — определяй чёткие сигнатуры типов.

✅ Пример:

```ts
export interface Processor {
  (input: Data, options: Options): Promise<Result>;
}
```

---

## 🗃️ Структура файлов и папок

- Файлы фабрик: `createXxx.ts`
- Файлы типов: `Xxx.ts` или `Xxx.types.ts`
- Файлы констант: `defaults.ts`, `errors.ts`, `config.ts`
- Файлы утилит: `noop.ts`, `sleep.ts`, `formatDate.ts`
- Папки:
  - `interfaces/` — для интерфейсов
  - `types/` — для типов и enum’ов
  - `utils/` — для утилит
  - `constants/` — для констант

---

## ✨ Пример “идеальной” фабрики (шаблон)

```ts
import { SomethingConfig } from "./interfaces/SomethingConfig.js";
import { SomethingDependencies } from "./interfaces/SomethingDependencies.js";
import { DEFAULT_CONFIG } from "../../../shared/constants/defaults.js";

const INTERNAL_CONSTANT = 100;

export const createSomething = (
  dependencies: SomethingDependencies,
  config: SomethingConfig = DEFAULT_CONFIG,
) => {
  const { adapter, logger = DEFAULT_LOGGER } = dependencies;

  const { timeout = 5000, onError = () => {} } = config;

  // Валидация
  if (!adapter) {
    throw new Error("Adapter is required");
  }

  let internalState = null;
  let isProcessing = false;

  const doWork = async (input: string) => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const result = await adapter.process(input, { timeout });
      return { success: true, result };
    } catch (error) {
      onError(error);
      return { success: false, error };
    } finally {
      isProcessing = false;
    }
  };

  const getStatus = () => {
    return { isProcessing, state: internalState };
  };

  return {
    doWork,
    getStatus,
  };
};
```

---

## 🚫 Что избегаем

- ❌ `snake_case` или `kebab-case` в именах переменных/функций
- ❌ Не типизировать параметры и возвращаемые значения
- ❌ Передавать в фабрики плоские параметры — только объекты (`dependencies`, `config`)
- ❌ Не логировать ошибки и предупреждения
- ❌ Не сбрасывать флаги состояния в `finally`
- ❌ Использовать `any` без крайней необходимости
- ❌ Глубокую вложенность — выносите логику во внутренние функции

---

## 🛠 Инструменты

- **Prettier** — автоформатирование. Не форматируйте вручную.
- **ESLint** — ловит стилевые и логические ошибки. Не игнорируйте предупреждения.
- **TypeScript** — строгая типизация. Используйте `strict: true` в `tsconfig`.

---

> 💡 **Совет новичку**:  
> — Если сомневаешься — посмотри, как сделано в соседних файлах.  
> — Если хочешь что-то изменить — обсуди с командой.  
> — Если линтер/TypeScript ругается — исправь, а не отключай правило.

---

## 📌 Чек-лист перед коммитом

- [ ] Имена — в правильном case (`camelCase`, `PascalCase`, `UPPER_CASE`)
- [ ] Фабрики — принимают `dependencies` и `config`
- [ ] Все параметры и возвраты — типизированы
- [ ] Ошибки — обрабатываются и логируются
- [ ] Флаги состояния — сбрасываются в `finally`
- [ ] ESLint и TypeScript — не ругаются
