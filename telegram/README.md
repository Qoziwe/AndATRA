# AndATRA Telegram Bot

Citizen-facing Telegram bot for the **AndATRA** municipal analytics platform.
Citizens use this bot to report city problems. The bot collects structured input and forwards it to the real backend API.

## Architecture

```text
AndATRA/
|- backend/      <- Flask API
|- frontend/     <- React Native Web
`- telegram/     <- Telegram bot
```

The bot is intentionally thin and contains no domain analytics logic.

## Quick Start

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
```

Set these values in `.env`:

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token from [@BotFather](https://t.me/BotFather) |
| `BACKEND_URL` | Real backend API base URL |
| `BOT_SECRET` | Shared secret that must match backend `TELEGRAM_BOT_SECRET` |

### 3. Start the real backend

Make sure the Flask backend is running and reachable at `BACKEND_URL`.

### 4. Start the bot

```bash
python bot/main.py
```

### 5. Run unit tests

```bash
pytest tests/ -v
```

## Bot Flow

```text
/start
  `- Welcome message + main menu keyboard
     |- [Подать обращение] -> appeal conversation
     |  Step 1: Category selection
     |  Step 2: Text description
     |  Step 3: Photo (optional, /skip)
     |  Step 4: Location (optional, /skip)
     |  Step 5: Confirmation -> submit to backend
     `- [Помощь] -> help text
```

## Project Structure

```text
telegram/
|- bot/
|  |- __init__.py
|  |- main.py
|  |- config.py
|  |- states.py
|  |- messages.py
|  |- handlers/
|  |  |- start.py
|  |  |- appeal.py
|  |  |- help.py
|  |  `- fallback.py
|  |- keyboards/
|  |  |- main_menu.py
|  |  `- categories.py
|  `- services/
|     `- api_client.py
|- tests/
|  |- test_api_client.py
|  `- test_handlers.py
|- .env.example
|- .gitignore
|- pytest.ini
|- requirements.txt
`- README.md
```

## Backend API Contract

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/categories` | List appeal categories |
| `POST` | `/api/appeals/intake` | Submit a new appeal |

All requests include the `X-Bot-Secret` header for authentication.
