# AndATRA Setup Notes

Актуальные рабочие части проекта:

- `backend` на Flask + SQLite + Socket.IO
- `telegram` как канал приема обращений
- `frontend` на Expo Router / React Native Web
- AI-слой с режимами mock и Ollama

## Что важно знать про текущую версию

- проект больше не опирается на отдельную `summary`-ноду
- основная аналитика считается backend-сервисами на Python и SQLAlchemy
- актуальные LLM-роли сейчас: `primary`, `classify`, `vision`
- для локальной разработки без LLM удобнее всего запускать проект с `ENABLE_LLM=false`
- `python -m app.data.seed` полезен для демо, потому что добавляет тестовые обращения
- `AUTO_SEED_REFERENCE_DATA=true` автоматически поднимает категории и районы

## Быстрый локальный запуск

### 1. Установить зависимости

```powershell
python -m pip install -r backend\requirements.txt -r telegram\requirements.txt
npm --prefix frontend install
```

### 2. Создать `.env` файлы

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item telegram\.env.example telegram\.env
Copy-Item frontend\.env.example frontend\.env
```

### 3. Рекомендуемый `backend/.env` для разработки

```env
FLASK_SECRET_KEY=change_this_secret
DATABASE_URL=sqlite:///andatra.db
APP_HOST=0.0.0.0
APP_PORT=5000
FLASK_DEBUG=false
AUTO_SEED_REFERENCE_DATA=true
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006
SOCKETIO_ASYNC_MODE=threading

LLM_PRIMARY_URL=http://localhost:11434
LLM_CLASSIFY_URL=http://localhost:11434
LLM_VISION_URL=http://localhost:11434
LLM_PRIMARY_MODEL=llama3
LLM_CLASSIFY_MODEL=mistral
LLM_VISION_MODEL=llava
ENABLE_LLM=false

GEOCODING_ENABLED=true
GEOCODING_REVERSE_URL=https://nominatim.openstreetmap.org/reverse
GEOCODING_USER_AGENT=AndATRA/1.0
GEOCODING_TIMEOUT=6

TELEGRAM_BOT_SECRET=shared_secret_token_here
```

### 4. Рекомендуемый `telegram/.env`

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
BACKEND_URL=http://localhost:5000
BACKEND_TIMEOUT_SECONDS=45
BOT_SECRET=shared_secret_token_here
```

### 5. Рекомендуемый `frontend/.env`

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:5000
EXPO_PUBLIC_APP_NAME=AndATRA
EXPO_PUBLIC_TOMTOM_API_KEY=your_tomtom_api_key
EXPO_PUBLIC_AIR_QUALITY_API_URL=https://air-quality-api.open-meteo.com/v1/air-quality
```

### 6. Поднять базу и демо-данные

```powershell
cd backend
alembic upgrade head
python -m app.data.seed
```

### 7. Запустить сервисы

Backend:

```powershell
cd backend
python run.py
```

Frontend:

```powershell
cd frontend
npm run web
```

Telegram bot:

```powershell
cd telegram
python -m bot.main
```

## Что именно делает AI в проекте

1. Новое обращение приходит в backend.
2. Intake-анализ проверяет, похоже ли сообщение на реальную городскую проблему.
3. Классификация определяет категорию, приоритет, теги и summary.
4. Если пользователь приложил фото, vision-анализ помогает подтвердить релевантность и содержание.
5. Операторский AI-чат отвечает на вопросы по данным системы.
6. Traffic AI строит рекомендации по дорожной ситуации и фазам светофоров.

## Актуальные экраны frontend

- `/` - dashboard
- `/appeals` и `/appeals/[id]` - реестр и карточка обращения
- `/analytics` и `/analytics/trends` - аналитика
- `/map` - карта города
- `/air-quality` - карта качества воздуха
- `/traffic-ai` - traffic AI и traffic chat
- `/categories` - каталог категорий
- `/chat` - AI-ассистент
- `/reports` - экспортные отчеты
- `/profile` - профиль и системные действия

## Полезные команды

Проверка backend:

```powershell
cd backend
python -m pytest
```

Проверка telegram:

```powershell
cd telegram
python -m pytest
```

Проверка frontend:

```powershell
cd frontend
npm run typecheck
```

Проверка доступности Ollama-нод:

```powershell
cd backend
python scripts\check_llm_nodes.py
```

## Замечания по конфигу

- если нужен стабильный локальный запуск без нейросетей, оставляй `ENABLE_LLM=false`
- если включаешь живые модели, проверь `LLM_PRIMARY_*`, `LLM_CLASSIFY_*` и `LLM_VISION_*`
- `LLM_SUMMARY_*` для текущей версии не нужны
- air quality страница может работать без API key
- traffic-функции лучше работают, когда задан `EXPO_PUBLIC_TOMTOM_API_KEY`
- Telegram polling предполагает один активный процесс бота на токен

## Актуальные документы

- основной обзор репозитория: `README.md`
- краткое описание проекта: `PROJECT_DESCRIPTION.txt`
- сценарии запуска: `RUN_GUIDE.md`
- эти заметки: `some_instructions.md`
