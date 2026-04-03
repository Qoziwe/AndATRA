# AndATRA: инструкция по запуску

Этот документ поможет быстро поднять проект локально: `backend`, `telegram` и `frontend`.

## Что нужно заранее

- `Python 3.11+`
- `Node.js 18+`
- `npm`
- `PowerShell` или другой терминал

Рекомендуется запускать каждую часть проекта в отдельном терминале:

- терминал 1: `backend`
- терминал 2: `telegram`
- терминал 3: `frontend`

## Структура проекта

```text
AndATRA/
|-- backend/
|-- telegram/
|-- frontend/
`-- RUN_GUIDE.md
```

## 1. Запуск backend

Перейдите в папку `backend`:

```powershell
cd backend
```

Создайте виртуальное окружение:

```powershell
python -m venv venv
```

Активируйте виртуальное окружение:

```powershell
.\venv\Scripts\Activate.ps1
```

Установите зависимости:

```powershell
pip install -r requirements.txt
```

Запустите backend:

```powershell
python run.py
```

По умолчанию backend стартует на:

```text
http://localhost:5000
```

## 2. Запуск Telegram-бота

Перейдите в папку `telegram`:

```powershell
cd telegram
```

Создайте виртуальное окружение:

```powershell
python -m venv venv
```

Активируйте виртуальное окружение:

```powershell
.\venv\Scripts\Activate.ps1
```

Установите зависимости:

```powershell
pip install -r requirements.txt
```

Запустите бота:

```powershell
python -m bot.main
```

Важно: Telegram-бот должен видеть уже запущенный `backend`.

## 3. Запуск frontend

Перейдите в папку `frontend`:

```powershell
cd frontend
```

Установите зависимости:

```powershell
npm install
```

Запустите web-версию:

```powershell
npm run web
```

Frontend будет обращаться к `backend` по адресу из `frontend/.env`.

## Быстрый порядок запуска

Если нужно просто поднять проект без лишних шагов, используйте такой порядок:

1. Сначала запустите `backend`.
2. Затем запустите `telegram`.
3. После этого запустите `frontend`.

## Работа с `.env`

У проекта три отдельных файла окружения:

- `backend/.env`
- `telegram/.env`
- `frontend/.env`

Если какого-то файла ещё нет, создайте его из примера:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item telegram\.env.example telegram\.env
Copy-Item frontend\.env.example frontend\.env
```

## `backend/.env`

Пример минимальной конфигурации:

```env
FLASK_SECRET_KEY=change_this_secret
DATABASE_URL=sqlite:///andatra.db
APP_HOST=0.0.0.0
APP_PORT=5000
FLASK_DEBUG=false
AUTO_SEED_REFERENCE_DATA=true
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
SOCKETIO_ASYNC_MODE=threading
LLM_MOCK_MODE=true
TELEGRAM_BOT_SECRET=shared_secret_token_here
```

Что здесь важно:

- `APP_HOST` и `APP_PORT` задают адрес запуска backend.
- `DATABASE_URL` указывает, где хранится база данных.
- `FLASK_SECRET_KEY` нужен Flask-приложению.
- `CORS_ORIGINS` разрешает запросы с frontend.
- `LLM_MOCK_MODE=true` удобно для локального запуска без реального Ollama.
- `TELEGRAM_BOT_SECRET` должен совпадать с `BOT_SECRET` в `telegram/.env`.

Дополнительно в `backend/.env` есть настройки для:

- Ollama и LLM-моделей: `LLM_PRIMARY_URL`, `LLM_CLASSIFY_URL`, `LLM_VISION_URL` и другие
- reverse geocoding: `GEOCODING_ENABLED`, `GEOCODING_REVERSE_URL`, `GEOCODING_USER_AGENT`

Если вы пока не настраиваете AI-инфраструктуру, проще оставить локальный запуск в режиме:

```env
LLM_MOCK_MODE=true
```

## `telegram/.env`

Пример:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
BACKEND_URL=http://localhost:5000
BACKEND_TIMEOUT_SECONDS=45
BOT_SECRET=shared_secret_token_here
```

Что здесь важно:

- `TELEGRAM_BOT_TOKEN` нужно получить у `@BotFather`.
- `BACKEND_URL` должен указывать на работающий backend.
- `BOT_SECRET` должен совпадать со значением `TELEGRAM_BOT_SECRET` из `backend/.env`.
- `BACKEND_TIMEOUT_SECONDS` задаёт таймаут запросов бота к backend.

Если `BOT_SECRET` не совпадает, backend не примет запросы от Telegram-бота.

## `frontend/.env`

Пример:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:5000
EXPO_PUBLIC_APP_NAME=AndATRA
EXPO_PUBLIC_TOMTOM_API_KEY=your_tomtom_api_key
EXPO_PUBLIC_AIR_QUALITY_API_URL=https://air-quality-api.open-meteo.com/v1/air-quality
```

Что здесь важно:

- `EXPO_PUBLIC_BACKEND_URL` должен указывать на backend.
- `EXPO_PUBLIC_APP_NAME` задаёт имя приложения.
- `EXPO_PUBLIC_TOMTOM_API_KEY` нужен для TomTom-карт и трафика, если эта функциональность используется.
- `EXPO_PUBLIC_AIR_QUALITY_API_URL` задаёт URL сервиса качества воздуха.

Самая важная переменная для старта frontend:

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Как связаны сервисы между собой

Схема очень простая:

- `frontend` ходит в `backend` по `EXPO_PUBLIC_BACKEND_URL`
- `telegram` ходит в `backend` по `BACKEND_URL`
- `backend` проверяет `TELEGRAM_BOT_SECRET`
- `telegram` передаёт такой же секрет через `BOT_SECRET`

То есть для корректной работы нужно, чтобы:

- `frontend/.env` ссылался на правильный backend
- `telegram/.env` ссылался на правильный backend
- `backend/.env` и `telegram/.env` содержали одинаковый секрет для бота

## Частые проблемы

### 1. Не активируется `venv`

Если PowerShell блокирует запуск скриптов, выполните:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
```

После этого снова активируйте окружение:

```powershell
.\venv\Scripts\Activate.ps1
```

### 2. Frontend не видит backend

Проверьте:

- запущен ли `backend`
- совпадает ли порт в `backend/.env`
- правильно ли указан `EXPO_PUBLIC_BACKEND_URL` в `frontend/.env`

### 3. Telegram-бот не отправляет данные

Проверьте:

- запущен ли `backend`
- правильно ли указан `BACKEND_URL`
- совпадают ли `BOT_SECRET` и `TELEGRAM_BOT_SECRET`
- корректный ли `TELEGRAM_BOT_TOKEN`

## Рекомендуемый минимальный сценарий для локального старта

Если вы хотите просто быстро запустить проект локально, можно использовать такой набор:

### `backend/.env`

```env
APP_HOST=0.0.0.0
APP_PORT=5000
DATABASE_URL=sqlite:///andatra.db
LLM_MOCK_MODE=true
TELEGRAM_BOT_SECRET=shared_secret_token_here
```

### `telegram/.env`

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
BACKEND_URL=http://localhost:5000
BOT_SECRET=shared_secret_token_here
```

### `frontend/.env`

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:5000
EXPO_PUBLIC_APP_NAME=AndATRA
```

## Кратко

Команды по запуску:

```powershell
# backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

```powershell
# telegram
cd telegram
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m bot.main
```

```powershell
# frontend
cd frontend
npm install
npm run web
```
