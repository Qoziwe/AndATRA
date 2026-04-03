# AndATRA Setup Notes

Актуальная схема проекта:

- `backend` на Flask + SQLite + Socket.IO
- `telegram` бот для приема обращений
- `frontend` на Expo Router / React Native Web
- интеграция с `Ollama`
- 2 LLM-роли:
  - `primary` для AI-чата
  - `classify` для обработки обращений граждан

Важно:

- отдельной `summary`-ноды в проекте больше нет
- аналитика строится самим backend на основе данных БД
- narrative и highlights в аналитике вычисляются без третьей модели

## Быстрый локальный запуск

### `backend/.env`

```env
FLASK_ENV=development
FLASK_SECRET_KEY=change_this_secret
DATABASE_URL=sqlite:///andatra.db
APP_HOST=0.0.0.0
APP_PORT=5000
FLASK_DEBUG=false
AUTO_SEED_REFERENCE_DATA=true
CORS_ORIGINS=http://localhost:8081,http://127.0.0.1:8081,http://localhost:19006,http://127.0.0.1:19006
SOCKETIO_ASYNC_MODE=threading

LLM_PRIMARY_URL=http://localhost:11434
LLM_CLASSIFY_URL=http://localhost:11434
LLM_PRIMARY_MODEL=llama3
LLM_CLASSIFY_MODEL=mistral

LLM_MOCK_MODE=true
TELEGRAM_BOT_SECRET=shared_secret_token_here
```

### Команды

```powershell
cd C:\Users\Lev\Desktop\AndANTRA
python -m pip install -r backend\requirements.txt -r telegram\requirements.txt
cd frontend
npm install
cd ..\backend
python -m app.data.seed
python run.py
```

Во втором терминале:

```powershell
cd C:\Users\Lev\Desktop\AndANTRA\telegram
python -m bot.main
```

В третьем терминале:

```powershell
cd C:\Users\Lev\Desktop\AndANTRA\frontend
npm start
```

## LAN-режим с реальными LLM

Используй 2 ноды:

- `PC-1`: `primary` (`llama3`)
- `PC-2`: `classify` (`mistral`)

Пример backend-конфига:

```env
LLM_PRIMARY_URL=http://192.168.0.10:11434
LLM_CLASSIFY_URL=http://192.168.0.11:11434
LLM_PRIMARY_MODEL=llama3
LLM_CLASSIFY_MODEL=mistral
LLM_MOCK_MODE=false
```

Проверка доступности нод:

```powershell
cd C:\Users\Lev\Desktop\AndANTRA\backend
python scripts\check_llm_nodes.py
```

## Что делает AI

1. Новое обращение приходит в backend.
2. Фоновый worker вызывает `classify`-модель.
3. Модель возвращает категорию, приоритет, теги, район и короткий summary кейса.
4. AI-чат сотрудников работает через `primary`-модель.
5. Аналитика сайта считается обычным Python-кодом и SQLAlchemy-запросами без отдельной summary-модели.

## Актуальные документы

- основной обзор: `README.md`
- backend: `backend/README.md`
- LAN deployment: `LOCAL_NETWORK_DEPLOYMENT.md`
