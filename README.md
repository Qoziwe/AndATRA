# AndATRA

AndATRA is a municipal operations platform for collecting, enriching, and analyzing city issues.

The repository combines three working parts:

- `telegram/`: a citizen-facing Telegram bot for issue intake
- `backend/`: a Flask API with persistence, analytics, realtime events, and AI orchestration
- `frontend/`: an Expo Router + React Native Web dashboard for operators and analysts

## What The Product Does

AndATRA is designed around one continuous workflow:

1. A resident submits an issue in Telegram.
2. The backend validates and stores the appeal.
3. AI-assisted enrichment classifies the case, sets priority, extracts tags, and builds a short summary.
4. The dashboard shows the updated data through API requests and realtime Socket.IO events.
5. Operators review appeals, trends, district signals, map data, and AI-generated recommendations.

## Current Feature Set

### Telegram bot

- Multi-step intake flow
- Category selection from backend reference data
- Free-text problem description
- Optional photo upload
- Optional geolocation or manual address
- Final confirmation before submission
- Shared-secret authentication against the backend API

### Backend

- Flask application factory
- SQLite + SQLAlchemy models
- Alembic migrations
- Appeal intake and appeal listing/detail endpoints
- Categories and districts reference endpoints
- Analytics endpoints for dashboard, summary, trends, category breakdown, and heatmap
- AI chat endpoint for operators
- Traffic AI endpoints for congestion analysis and traffic chat
- Socket.IO namespace for dashboard updates
- Mock LLM mode for local development
- Ollama routing for primary, classify, and vision tasks

### Frontend

- Dashboard with KPI cards, alerts, recent appeals, and category breakdown
- Appeals workspace with filters and detail pages
- Analytics overview and trends pages
- City map screen
- Air quality monitoring page
- Traffic AI page with recommendations and chat
- Categories catalog page
- AI chat page
- Reports/export page
- Profile/settings page
- TXT/PDF export actions in key screens

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | Expo Router, React Native Web, TypeScript, NativeWind, TanStack Query, Zustand, Leaflet |
| Backend | Flask, Flask-SocketIO, Flask-SQLAlchemy, SQLAlchemy, Alembic |
| Bot | python-telegram-bot, aiohttp |
| Data | SQLite |
| AI | Ollama-compatible local/LAN nodes, mock mode |
| Testing | pytest, pytest-flask, pytest-asyncio |

## Repository Structure

```text
AndATRA/
|-- backend/
|   |-- app/
|   |   |-- api/
|   |   |-- data/
|   |   |-- models/
|   |   |-- services/
|   |   `-- utils/
|   |-- migrations/
|   |-- scripts/
|   |-- tests/
|   `-- run.py
|-- frontend/
|   |-- app/
|   |-- components/
|   |-- hooks/
|   |-- services/
|   |-- stores/
|   |-- theme/
|   |-- types/
|   `-- utils/
|-- telegram/
|   |-- bot/
|   |   |-- handlers/
|   |   |-- keyboards/
|   |   `-- services/
|   `-- tests/
|-- PROJECT_DESCRIPTION.txt
|-- RUN_GUIDE.md
|-- some_instructions.md
`-- README.md
```

## Fast Local Demo

If you want the fastest working demo:

- run the backend with `LLM_MOCK_MODE=true`
- seed the local database
- open the frontend in web mode
- treat the Telegram bot as optional

This gives you a complete dashboard experience without external AI infrastructure.

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm
- Optional: Ollama
- Optional: Telegram bot token from `@BotFather`

### 1. Install dependencies

```powershell
python -m pip install -r backend\requirements.txt -r telegram\requirements.txt
npm --prefix frontend install
```

### 2. Create environment files

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item telegram\.env.example telegram\.env
Copy-Item frontend\.env.example frontend\.env
```

### 3. Recommended local configuration

`backend/.env`

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
LLM_VISION_ENABLED=true
LLM_MOCK_MODE=true

GEOCODING_ENABLED=true
TELEGRAM_BOT_SECRET=shared_secret_token_here
```

`telegram/.env`

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
BACKEND_URL=http://localhost:5000
BACKEND_TIMEOUT_SECONDS=45
BOT_SECRET=shared_secret_token_here
```

`frontend/.env`

```env
EXPO_PUBLIC_BACKEND_URL=http://localhost:5000
EXPO_PUBLIC_APP_NAME=AndATRA
EXPO_PUBLIC_TOMTOM_API_KEY=your_tomtom_api_key
EXPO_PUBLIC_AIR_QUALITY_API_URL=https://air-quality-api.open-meteo.com/v1/air-quality
```

### 4. Initialize the database

```powershell
cd backend
alembic upgrade head
python -m app.data.seed
```

Notes:

- the backend also creates tables automatically at startup
- `AUTO_SEED_REFERENCE_DATA=true` fills required reference dictionaries
- `python -m app.data.seed` is useful when you want demo appeals in the database

### 5. Start the backend

```powershell
cd backend
python run.py
```

Health check:

```powershell
curl http://localhost:5000/api/health
```

### 6. Start the frontend

```powershell
cd frontend
npm run web
```

### 7. Start the Telegram bot

```powershell
cd telegram
python -m bot.main
```

## API Overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `POST` | `/api/appeals/intake` | Intake from Telegram |
| `GET` | `/api/appeals` | Appeal list with filters and pagination |
| `GET` | `/api/appeals/<id>` | Appeal detail |
| `GET` | `/api/categories` | Categories reference data |
| `GET` | `/api/districts` | District reference data |
| `GET` | `/api/analytics/dashboard` | Dashboard counters |
| `GET` | `/api/analytics/summary` | Narrative summary and highlights |
| `GET` | `/api/analytics/trends` | Time-series analytics |
| `GET` | `/api/analytics/categories` | Category breakdown |
| `GET` | `/api/analytics/heatmap` | District heatmap |
| `POST` | `/api/chat` | Operator AI chat |
| `GET` | `/api/traffic/analyze` | Traffic recommendations |
| `POST` | `/api/traffic/chat` | Traffic-specific AI chat |

## AI Runtime Modes

### Mock mode

Use mock mode when you want predictable local behavior and no dependency on Ollama:

- `LLM_MOCK_MODE=true`
- canned responses for primary chat, intake analysis, classification, and vision analysis
- best option for UI work, demos, and smoke testing

### Ollama mode

Use live model calls when you want actual AI behavior:

- set `LLM_MOCK_MODE=false`
- configure `LLM_PRIMARY_*`, `LLM_CLASSIFY_*`, and `LLM_VISION_*`
- classification falls back to the primary node if needed

## Testing

### Backend

```powershell
cd backend
python -m pytest
```

### Frontend

```powershell
cd frontend
npm run typecheck
```

### Telegram bot

```powershell
cd telegram
python -m pytest
```

## Notes

- The current seeded content and UI copy are focused on Almaty.
- Parts of the interface are in Russian.
- SQLite is used for the MVP and local development.
- Telegram polling supports one active process per token.
- Air quality data comes from Open-Meteo.
- Traffic overlays and traffic analysis depend on TomTom-based frontend configuration and backend traffic services.

## Roadmap Ideas

- PostgreSQL instead of SQLite
- background job queue for classification and notifications
- authentication and role-based access control
- richer audit logs and observability
- multilingual support
- media storage abstraction for uploaded photos

