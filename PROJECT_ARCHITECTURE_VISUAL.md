# AndATRA: визуальная архитектура проекта

Этот файл описывает полную архитектуру проекта `AndATRA` в привязке к текущему коду репозитория.
Диаграммы сделаны в `Mermaid`, поэтому их удобно смотреть прямо в Markdown-рендерах GitHub, VS Code и совместимых IDE.

## 1. Системный контекст

```mermaid
flowchart LR
    Citizen["Житель города"] --> TG["Telegram Bot"]
    Ops["Оператор / аналитик"] --> FE["Frontend Dashboard"]

    TG -->|GET /api/categories| BE["Flask Backend"]
    TG -->|POST /api/appeals/intake| BE

    FE -->|REST /api/*| BE
    FE <-->|Socket.IO /ws/updates| BE

    BE --> DB[("SQLite")]
    BE --> GEO["Reverse Geocoding<br/>Nominatim / OSM"]
    BE --> OLLAMA["Ollama nodes<br/>primary / classify / vision"]
    BE --> GEMINI["Gemini fallback<br/>для traffic"]
    BE --> TOMTOM["TomTom Traffic API"]

    FE --> OPMETEO["Open-Meteo Air Quality API"]
    FE --> TOMTOM_TILES["TomTom traffic tiles"]
```

## 2. Главная взаимосвязь фронта, бэка и Telegram

```mermaid
flowchart TB
    subgraph Telegram Layer
        TGUser["Пользователь Telegram"]
        TGBot["python-telegram-bot"]
        TGUser --> TGBot
    end

    subgraph Backend Layer
        API["Flask API + Socket.IO"]
        Services["Service Layer"]
        Models["SQLAlchemy Models"]
        DB[("SQLite DB")]
        API --> Services
        Services --> Models
        Models --> DB
    end

    subgraph Frontend Layer
        FEUI["Expo Router UI"]
        FEHooks["Hooks"]
        FEServices["API / realtime services"]
        FEState["React Query + Zustand"]
        FEUI --> FEHooks
        FEHooks --> FEServices
        FEHooks --> FEState
        FEServices --> FEState
    end

    TGBot -->|категории / отправка обращения| API
    API -->|new_appeal event| FEServices
    FEServices -->|REST запросы| API
```

## 3. Структура репозитория

```text
AndATRA/
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |   |-- analytics.py
|   |   |   |-- appeals.py
|   |   |   |-- categories.py
|   |   |   |-- chat.py
|   |   |   |-- districts.py
|   |   |   |-- health.py
|   |   |   `-- traffic.py
|   |   |-- data/
|   |   |   |-- mock_appeals.py
|   |   |   `-- seed.py
|   |   |-- models/
|   |   |   |-- appeal.py
|   |   |   |-- category.py
|   |   |   |-- chat_log.py
|   |   |   `-- district.py
|   |   |-- services/
|   |   |   |-- address_service.py
|   |   |   |-- analytics_service.py
|   |   |   |-- appeal_service.py
|   |   |   |-- chat_service.py
|   |   |   |-- classification_service.py
|   |   |   |-- llm_service.py
|   |   |   `-- traffic_service.py
|   |   |-- utils/
|   |   |   |-- response.py
|   |   |   `-- validators.py
|   |   |-- config.py
|   |   |-- extensions.py
|   |   `-- __init__.py
|   |-- migrations/
|   |-- tests/
|   `-- run.py
|-- frontend/
|   |-- app/
|   |   |-- index.tsx
|   |   |-- _layout.tsx
|   |   |-- air-quality/
|   |   |-- analytics/
|   |   |-- appeals/
|   |   |-- categories/
|   |   |-- chat/
|   |   |-- map/
|   |   |-- profile/
|   |   |-- reports/
|   |   `-- traffic-ai/
|   |-- components/
|   |   |-- air-quality/
|   |   |-- analytics/
|   |   |-- appeals/
|   |   |-- chat/
|   |   |-- common/
|   |   |-- dashboard/
|   |   |-- icons/
|   |   |-- layout/
|   |   |-- map/
|   |   `-- traffic-ai/
|   |-- constants/
|   |   `-- config.ts
|   |-- hooks/
|   |   |-- useAirQuality.ts
|   |   |-- useAnalytics.ts
|   |   |-- useAppeals.ts
|   |   |-- useAppTheme.ts
|   |   |-- useChat.ts
|   |   |-- useRealtime.ts
|   |   |-- useReferenceData.ts
|   |   `-- useTrafficAi.ts
|   |-- services/
|   |   |-- airQuality.ts
|   |   |-- analytics.ts
|   |   |-- api.ts
|   |   |-- appeals.ts
|   |   |-- categories.ts
|   |   |-- chat.ts
|   |   |-- clientActions.ts
|   |   |-- districts.ts
|   |   |-- realtime.ts
|   |   `-- trafficAi.ts
|   |-- stores/
|   |-- theme/
|   |-- types/
|   `-- package.json
`-- telegram/
    |-- bot/
    |   |-- handlers/
    |   |   |-- appeal.py
    |   |   |-- fallback.py
    |   |   |-- help.py
    |   |   `-- start.py
    |   |-- keyboards/
    |   |   |-- categories.py
    |   |   |-- location.py
    |   |   `-- main_menu.py
    |   |-- services/
    |   |   `-- api_client.py
    |   |-- config.py
    |   |-- main.py
    |   |-- messages.py
    |   `-- states.py
    `-- tests/
```

## 4. Архитектура backend

```mermaid
flowchart TB
    subgraph Flask App
        Factory["create_app()"]
        Config["Config"]
        Ext["extensions.py<br/>db / cors / socketio"]
        Blueprints["Blueprints /api/*"]
        Factory --> Config
        Factory --> Ext
        Factory --> Blueprints
    end

    subgraph API Layer
        Health["health.py"]
        AppealsAPI["appeals.py"]
        AnalyticsAPI["analytics.py"]
        CategoriesAPI["categories.py"]
        DistrictsAPI["districts.py"]
        ChatAPI["chat.py"]
        TrafficAPI["traffic.py"]
    end

    subgraph Service Layer
        AppealService["appeal_service"]
        AnalyticsService["analytics_service"]
        ChatService["chat_service"]
        ClassificationService["classification_service"]
        AddressService["address_service"]
        LLMService["llm_service"]
        TrafficService["traffic_service"]
    end

    subgraph Persistence
        AppealModel["Appeal"]
        CategoryModel["Category"]
        DistrictModel["District"]
        ChatLogModel["ChatLog"]
        DB[("SQLite")]
    end

    Blueprints --> Health
    Blueprints --> AppealsAPI
    Blueprints --> AnalyticsAPI
    Blueprints --> CategoriesAPI
    Blueprints --> DistrictsAPI
    Blueprints --> ChatAPI
    Blueprints --> TrafficAPI

    AppealsAPI --> AppealService
    AppealsAPI --> AddressService
    AppealsAPI --> ClassificationService
    AnalyticsAPI --> AnalyticsService
    CategoriesAPI --> AnalyticsService
    DistrictsAPI --> DistrictModel
    ChatAPI --> ChatService
    TrafficAPI --> TrafficService

    AppealService --> AppealModel
    AppealService --> CategoryModel
    AppealService --> DistrictModel
    AppealService --> AddressService
    AppealService --> ClassificationService

    ClassificationService --> LLMService
    ClassificationService --> CategoryModel
    ClassificationService --> DistrictModel
    AddressService --> DistrictModel
    ChatService --> AppealModel
    ChatService --> ChatLogModel
    ChatService --> LLMService
    AnalyticsService --> AppealModel
    AnalyticsService --> CategoryModel
    AnalyticsService --> DistrictModel
    TrafficService --> LLMService

    AppealModel --> DB
    CategoryModel --> DB
    DistrictModel --> DB
    ChatLogModel --> DB
```

## 5. Жизненный цикл обращения из Telegram

```mermaid
sequenceDiagram
    participant U as Житель
    participant TG as Telegram Bot
    participant API as Backend API
    participant ADDR as address_service
    participant CLS as classification_service
    participant LLM as Ollama / Vision
    participant DB as SQLite
    participant WS as Socket.IO
    participant FE as Frontend

    U->>TG: Выбирает категорию, пишет текст, фото, локацию
    TG->>API: POST /api/appeals/intake
    API->>ADDR: resolve_location(...)
    ADDR-->>API: normalised location + district
    API->>CLS: analyze_intake(...)
    CLS->>LLM: text analysis / moderation / vision
    LLM-->>CLS: category, priority, tags, summary
    CLS-->>API: IntakeAssessment
    API->>DB: сохранить Appeal
    API->>WS: emit new_appeal
    WS-->>FE: realtime event
    FE->>API: повторный запрос списка appeals / dashboard stats
    API-->>TG: 201 + id обращения
    TG-->>U: подтверждение отправки
```

## 6. Внутренний поток frontend

```mermaid
flowchart LR
    Routes["app/* routes"] --> Hooks["hooks/*"]
    Hooks --> Query["TanStack Query"]
    Hooks --> Stores["Zustand stores"]
    Hooks --> Services["services/*"]

    Services --> Axios["axios api client"]
    Services --> Socket["socket.io-client"]
    Axios --> Backend["Flask Backend"]
    Socket --> Backend

    Routes --> UI["components/*"]
    UI --> Theme["theme + NativeWind"]

    Services --> OpenMeteo["Open-Meteo"]
    Services --> TomTom["TomTom tiles"]
```

### Основные экраны frontend

| Экран | Назначение | Основные источники данных |
| --- | --- | --- |
| `/` | оперативный дашборд | `/api/analytics/dashboard`, `/api/analytics/categories`, `/api/appeals` |
| `/appeals` | список и фильтрация обращений | `/api/appeals`, `/api/appeals/:id` |
| `/analytics` | сводка, тренды, heatmap | `/api/analytics/summary`, `/api/analytics/trends`, `/api/analytics/categories`, `/api/analytics/heatmap` |
| `/map` | карта районов и концентрации проблем | `/api/analytics/heatmap`, `/api/districts` |
| `/chat` | AI-чат для операторов | `POST /api/chat` |
| `/traffic-ai` | AI-анализ трафика | `GET /api/traffic/analyze`, `POST /api/traffic/chat` |
| `/air-quality` | качество воздуха | прямые запросы к Open-Meteo |
| `/categories` | каталог категорий | `/api/categories` |
| `/reports` | выгрузки и отчёты | frontend-side export + AI chat attachments |

## 7. Архитектура Telegram-бота

```mermaid
flowchart TB
    Main["bot/main.py"] --> Start["/start"]
    Main --> Help["/help"]
    Main --> Conv["ConversationHandler"]
    Main --> Fallback["fallback"]

    Conv --> Cat["WAITING_CATEGORY"]
    Conv --> Text["WAITING_TEXT"]
    Conv --> Photo["WAITING_PHOTO"]
    Conv --> Location["WAITING_LOCATION"]
    Conv --> Confirm["WAITING_CONFIRM"]

    Cat --> ApiClient["services/api_client.py"]
    Confirm --> ApiClient
    ApiClient --> Backend["Backend API"]

    Conv --> Keyboards["Inline / reply keyboards"]
    Conv --> Messages["messages.py"]
    Conv --> State["context.user_data"]
```

### Telegram conversation flow

```mermaid
flowchart TD
    A["/start"] --> B["Главное меню"]
    B --> C["Подать обращение"]
    C --> D["GET /api/categories"]
    D --> E["Выбор категории"]
    E --> F["Ввод текста"]
    F --> G{"Фото есть?"}
    G -->|Да| H["Загрузка фото + base64"]
    G -->|Нет| I["skip photo"]
    H --> J["Локация: geo или текст"]
    I --> J
    J --> K["Экран подтверждения"]
    K --> L{"Подтвердить?"}
    L -->|Да| M["POST /api/appeals/intake"]
    L -->|Нет| N["Отмена"]
    M --> O["Сообщение с id обращения"]
```

## 8. Модель данных backend

```mermaid
erDiagram
    CATEGORY ||--o{ CATEGORY : parent_child
    CATEGORY ||--o{ APPEAL : classifies
    DISTRICT ||--o{ APPEAL : locates

    CATEGORY {
        int id PK
        string name
        string slug UK
        string icon
        int parent_id FK
        text description
    }

    DISTRICT {
        int id PK
        string name
        string slug UK
        string city
        json coordinates_center
    }

    APPEAL {
        int id PK
        bigint citizen_telegram_id
        text text
        string photo_url
        string location_text
        float latitude
        float longitude
        int district_id FK
        int category_id FK
        string priority
        string status
        text ai_summary
        json ai_tags
        datetime created_at
        datetime updated_at
    }

    CHAT_LOG {
        int id PK
        string role
        text content
        json context_snapshot
        datetime created_at
    }
```

## 9. API-поверхность и потребители

| Endpoint | Кто использует | Зачем |
| --- | --- | --- |
| `GET /api/health` | Telegram, ручная проверка | health-check сервиса |
| `GET /api/categories` | Telegram, frontend | категории обращений |
| `GET /api/districts` | frontend | справочник районов |
| `POST /api/appeals/intake` | Telegram | создание обращения от жителя |
| `GET /api/appeals` | frontend | список обращений |
| `GET /api/appeals/<id>` | frontend | карточка обращения |
| `GET /api/analytics/dashboard` | frontend | KPI для главного экрана |
| `GET /api/analytics/summary` | frontend | аналитическая сводка |
| `GET /api/analytics/trends` | frontend | динамика по дням |
| `GET /api/analytics/categories` | frontend | разбивка по категориям |
| `GET /api/analytics/heatmap` | frontend | концентрация по районам |
| `POST /api/chat` | frontend | AI-чат по обращениям |
| `GET /api/traffic/analyze` | frontend | AI-рекомендации по трафику |
| `POST /api/traffic/chat` | frontend | traffic-specific AI chat |
| `Socket.IO new_appeal` | frontend | realtime-обновление списка обращений и KPI |

## 10. Внешние интеграции

```mermaid
flowchart LR
    Backend["Backend"] --> Ollama["Ollama primary/classify/vision"]
    Backend --> Nominatim["Nominatim reverse geocoding"]
    Backend --> TomTomAPI["TomTom Traffic API"]
    Backend --> Gemini["Gemini API fallback"]

    Frontend["Frontend"] --> OpenMeteo["Open-Meteo Air Quality"]
    Frontend --> TomTomTiles["TomTom traffic tile layer"]
    Telegram["Telegram Bot"] --> TelegramCloud["Telegram Platform"]
```

## 11. Технические роли модулей

### Backend

- `app/__init__.py` поднимает Flask app, подключает `db`, `cors`, `socketio`, регистрирует blueprints, создаёт таблицы и автосидит справочники.
- `app/api/*` содержит HTTP-слой и делегирует бизнес-логику в `services`.
- `app/services/appeal_service.py` является ядром intake-flow: создаёт обращение, вызывает определение адреса, AI-анализ и шлёт realtime-событие.
- `app/services/classification_service.py` отвечает за модерацию, приоритизацию, автокатегоризацию, vision-анализ фото и AI summary.
- `app/services/address_service.py` нормализует адрес, делает reverse geocoding и матчинг района.
- `app/services/chat_service.py` строит LLM-контекст из БД и сохраняет историю чата в `chat_logs`.
- `app/services/analytics_service.py` агрегирует обращения в dashboard, summary, trends, category breakdown и heatmap.
- `app/services/traffic_service.py` получает traffic data, анализирует их через LLM или deterministic fallback.
- `app/services/llm_service.py` маршрутизирует вызовы в Ollama, поддерживает mock mode и fallback между нодами.

### Frontend

- `app/_layout.tsx` поднимает `QueryClientProvider`, realtime bridge, тему и общий `AppShell`.
- `hooks/*` инкапсулируют загрузку данных и бизнес-сценарии UI.
- `services/api.ts` создаёт общий `axios`-клиент к backend.
- `services/realtime.ts` создаёт singleton Socket.IO client.
- `stores/*` держат локальное состояние интерфейса, чата, уведомлений и traffic AI.
- `components/*` разбиты по доменам экранов, а не в одну общую папку.

### Telegram

- `bot/main.py` запускает polling и регистрирует handlers.
- `bot/handlers/appeal.py` реализует пошаговый intake-процесс.
- `bot/services/api_client.py` делает асинхронные вызовы к backend с `X-Bot-Secret`.
- `bot/keyboards/*` формируют inline/reply-кнопки для категорий, меню и геолокации.

## 12. Ключевая архитектурная идея проекта

`AndATRA` построен как hub-and-spoke система:

1. `Telegram` является citizen-facing каналом сбора данных.
2. `Backend` является единым центром бизнес-логики, AI-обработки, хранения, аналитики и realtime-синхронизации.
3. `Frontend` является operator-facing интерфейсом поверх backend API и websocket-событий.

Иными словами:

- Telegram ничего не знает про аналитику и не хранит бизнес-логику.
- Frontend ничего не знает про модерацию и классификацию, он только отображает данные и отправляет запросы.
- Backend связывает всё вместе: intake, enrichment, storage, AI, analytics, realtime.

