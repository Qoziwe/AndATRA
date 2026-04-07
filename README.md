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
- PostgreSQL + SQLAlchemy models
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
| Data | PostgreSQL |
| AI | Ollama-compatible local/LAN nodes with optional LLM disable switch |
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

- run the backend with `ENABLE_LLM=false`
- initialize and seed the PostgreSQL database
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
APP_ENV=development
FLASK_SECRET_KEY=change_this_secret
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/andatra
APP_HOST=0.0.0.0
APP_PORT=5000
FLASK_DEBUG=false
AUTO_SEED_REFERENCE_DATA=true
CORS_ORIGINS=http://localhost:3000,http://localhost:8081,http://localhost:19006
SOCKETIO_ASYNC_MODE=threading
ENFORCE_API_AUTH=false
TELEGRAM_BOT_SECRET=shared_secret_token_here
AUTH_USERNAME=operator
AUTH_PASSWORD=change_this_password
AUTH_DISPLAY_NAME=Оператор AndATRA
AUTH_TOKEN_MAX_AGE_HOURS=24

LLM_PRIMARY_URL=http://localhost:11434
LLM_CLASSIFY_URL=http://localhost:11434
LLM_VISION_URL=http://localhost:11434
LLM_PRIMARY_MODEL=llama3
LLM_CLASSIFY_MODEL=mistral
LLM_VISION_MODEL=llava
ENABLE_LLM=false

GEOCODING_ENABLED=true
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

- run `alembic upgrade head` before the first backend start or after schema changes
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
curl http://localhost:5000/api/ready
```

### 6. Start the frontend

```powershell
cd frontend
npm run web
```

### 6a. Publish the frontend to GitHub Pages

The repository now includes a GitHub Actions workflow at `.github/workflows/deploy-frontend-pages.yml` that exports the Expo web app and deploys it to GitHub Pages.

Before the first deployment:

- enable GitHub Pages in the repository settings and select `GitHub Actions` as the source
- add the repository variable `EXPO_PUBLIC_BACKEND_URL` with the public base URL of your backend API
- optionally add `EXPO_PUBLIC_TOMTOM_API_KEY`, `EXPO_PUBLIC_AIR_QUALITY_API_URL`, and `GITHUB_PAGES_CNAME`

What happens after that:

- every push to `main` that changes `frontend/**` triggers a fresh Pages deployment
- the workflow automatically exports the app with the repository subpath, creates `404.html` for Expo Router refreshes, and adds `.nojekyll`
- for this repository the site URL will be `https://qozziwe.github.io/AndATRA/`

You can also generate the deployable build locally:

```powershell
cd frontend
$env:GITHUB_REPOSITORY="Qoziwe/AndATRA"
$env:GITHUB_PAGES_BASE_PATH="/AndATRA"
npm run build:github-pages
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
| `GET` | `/api/ready` | Readiness check for Render |
| `POST` | `/api/auth/login` | Single-account login |
| `GET` | `/api/auth/me` | Current operator identity |
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

### Production auth

- set one operator account with `AUTH_USERNAME` and `AUTH_PASSWORD`
- login via `POST /api/auth/login`, then use `Authorization: Bearer <access_token>` for protected dashboard endpoints
- `/api/chat`, `/api/traffic/chat`, `PATCH /api/appeals/<id>/status`, `/api/auth/me` and `/ws/updates` require the signed access token when `ENFORCE_API_AUTH=true`

## AI Runtime Modes

### LLM disabled

Use disabled mode when you want the site to work without any LLM infrastructure:

- `ENABLE_LLM=false`
- chat endpoints immediately return `LLM модели отключены.`
- Telegram intake skips AI moderation and accepts submissions without LLM checks

### LLM enabled

Use live model calls when you want actual AI behavior:

- set `ENABLE_LLM=true`
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
- PostgreSQL is the primary backend database.
- Backend tests still use isolated in-memory SQLite for fast local runs.
- Telegram polling supports one active process per token.
- Air quality data comes from Open-Meteo.
- Traffic overlays and traffic analysis depend on TomTom-based frontend configuration and backend traffic services.

## Roadmap Ideas

- background job queue for classification and notifications
- authentication and role-based access control
- richer audit logs and observability
- multilingual support
- media storage abstraction for uploaded photos
