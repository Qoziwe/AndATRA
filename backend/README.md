# AndATRA Backend

Municipal urban analytics platform backend - the central orchestrator serving both the React Native Web frontend and the Telegram bot.

## Tech Stack

- Python 3.11+ / Flask / Flask-SocketIO
- SQLAlchemy + SQLite (MVP) -> PostgreSQL (production)
- Ollama LLM integration (primary + classify nodes)
- Pydantic v2 for validation

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env as needed
```

### 3. Initialize the database

```bash
alembic upgrade head
python -m app.data.seed
```

### 4. Run the server

**With mock LLM (no GPU/Ollama needed):**

```bash
# Windows CMD
set LLM_MOCK_MODE=true && python run.py

# PowerShell
$env:LLM_MOCK_MODE="true"; python run.py

# Linux/Mac
LLM_MOCK_MODE=true python run.py
```

**With real Ollama nodes:**

```bash
# Ensure .env has correct LLM_*_URL values pointing to your Ollama instances
python run.py
```

The server starts on `http://0.0.0.0:5000`.

### 5. Run tests

```bash
pytest tests/ -v
```

### 6. Test an endpoint manually

```bash
curl http://localhost:5000/api/health

curl -X POST http://localhost:5000/api/appeals/intake \
  -H "Content-Type: application/json" \
  -H "X-Bot-Secret: shared_secret_token_here" \
  -d '{"telegram_id": 123, "text": "РЇРјР° РЅР° РґРѕСЂРѕРіРµ РїРѕ РђР±Р°СЏ 10", "category_slug": "transport"}'
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/appeals/intake` | Create appeal (Telegram bot) |
| GET | `/api/appeals` | List appeals (filterable) |
| GET | `/api/appeals/<id>` | Get single appeal |
| GET | `/api/analytics/summary` | Aggregated summary |
| GET | `/api/analytics/trends` | Time-series for charts |
| GET | `/api/analytics/heatmap` | District heatmap data |
| GET | `/api/categories` | Category tree |
| GET | `/api/districts` | All districts |
| POST | `/api/chat` | AI chat with DB context |
| WS | `/ws/updates` | Real-time `new_appeal` events |

All endpoints return:

```json
{ "success": true, "data": {}, "error": null }
```

## LLM Architecture

Two Ollama nodes across local network:

| Role | Default Model | Purpose |
|------|--------------|---------|
| Primary | llama3 | General chat |
| Classify | mistral | Appeal classification |

Configure via `LLM_PRIMARY_*` and `LLM_CLASSIFY_*` in `.env`.

## Project Structure

```text
backend/
|-- app/
|   |-- __init__.py
|   |-- config.py
|   |-- extensions.py
|   |-- models/
|   |-- api/
|   |-- services/
|   |-- data/
|   `-- utils/
|-- migrations/
|-- tests/
|-- run.py
`-- requirements.txt
```
