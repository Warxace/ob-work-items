# ob-wi-mcp — План реализации

> MCP-сервер для git-native issue tracker (Open Brain / Work Items)
> Дизайн: [[Issue Tracking]] в Obsi-vault/Open Brain/

## Стек

- TypeScript, Node.js (ESM)
- `@modelcontextprotocol/sdk` — MCP-сервер, транспорт stdio
- `zod` — валидация входных параметров tools
- `gray-matter` — парсинг/сериализация YAML frontmatter + markdown body
- `simple-git` — git commit/push/pull
- `vitest` — тесты

## Структура проекта

```
ob-wi-mcp/
  package.json
  tsconfig.json
  PLAN.md
  src/
    index.ts              # точка входа: создание сервера, подключение транспорта
    config.ts             # загрузка конфига (путь к репо, push-стратегия)
    server.ts             # регистрация MCP tools на сервере
    tools/
      create.ts           # create_work_item
      get.ts              # get_work_item
      list.ts             # list_work_items
      update.ts           # update_work_item
      search.ts           # search_work_items
      validate.ts         # validate_work_item
    core/
      work-item.ts        # типы WorkItem, парсинг/сериализация файлов
      id.ts               # генерация ID (YYYYMMDD-XXXX)
      schema.ts           # загрузка .schema/types.yaml, advisory validation
    git/
      git.ts              # commit, push, pull — обёртка над simple-git
      sync.ts             # стратегия push (periodic / on-commit / manual)
  tests/
    core/
      work-item.test.ts
      id.test.ts
      schema.test.ts
    tools/
      create.test.ts
      list.test.ts
      update.test.ts
      search.test.ts
    git/
      git.test.ts
```

## Фазы реализации

### Фаза 1 — Ядро (без MCP, без git)

Цель: можно создать, прочитать, найти work item как файл. Всё тестируется юнитами.

1. **Инициализация проекта.** package.json, tsconfig.json, зависимости.
2. **Типы и ID.** Интерфейс `WorkItem`, генератор ID `YYYYMMDD-XXXX`.
3. **Парсинг/сериализация.** `parseWorkItem(filePath) → WorkItem`, `serializeWorkItem(item) → string`. На основе gray-matter.
4. **CRUD на файловой системе.** Создание файла, чтение по ID, список с фильтрами (type, status, priority, tags), обновление frontmatter и body.
5. **Полнотекстовый поиск.** Простой grep по body всех WI файлов.
6. **Schema и валидация.** Загрузка `.schema/types.yaml`, advisory warnings при validate.

Результат: библиотека `core/` с полным покрытием тестами, работающая с обычной папкой на диске.

### Фаза 2 — MCP-сервер

Цель: агент через MCP-клиент (opencode, Claude Desktop) может работать с трекером.

1. **Регистрация tools.** Каждый tool — обёртка над core, с zod-схемой параметров.
2. **Конфиг.** Путь к репозиторию work-items передаётся через аргумент или env.
3. **Точка входа.** `src/index.ts` — создаёт сервер, подключает stdio transport, стартует.
4. **Проверка с MCP Inspector.** `npx @modelcontextprotocol/inspector` для ручного тестирования.

Результат: рабочий MCP-сервер, который можно подключить к opencode/Claude Desktop.

### Фаза 3 — Git-слой

Цель: мутации автоматически коммитятся, sync между машинами работает.

1. **Git-обёртка.** `commit(message)`, `pull()`, `push()` через simple-git.
2. **Auto-commit.** После каждой мутации (create/update) — автоматический commit.
3. **Sync-стратегия.** Push периодический (настраивается в конфиге). Pull при старте сервера.
4. **Graceful degradation.** Если remote не настроен или недоступен — сервер продолжает работать локально, логирует предупреждение.

Результат: полностью рабочий трекер с синхронизацией.

### Фаза 4 — Init-команда

Цель: одна команда создаёт готовый репозиторий work-items.

1. `npx ob-wi-mcp init <path>` — создаёт папку, `git init`, `.schema/types.yaml` с дефолтными типами, начальный коммит.

## Примечание по документации

Пользовательская документация, установка и примеры подключения вынесены в `README.md`.
`PLAN.md` оставляем только для внутренних заметок по реализации.
