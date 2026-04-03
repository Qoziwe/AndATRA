# AndATRA Local Network Deployment

This guide describes how to run AndATRA with:

- one main computer that stores the codebase and database
- two Ollama nodes on the local network
- one model role per computer

Recommended layout:

- `PC-1` - main server with `backend`, `telegram`, `frontend`, SQLite database, and the `primary` model
- `PC-2` - Ollama node for `classification`

Example IP addresses:

- `PC-1`: `192.168.0.10`
- `PC-2`: `192.168.0.11`

Adjust the IPs below to your actual LAN addresses.

## 1. Prepare Ollama on both computers

Official Ollama docs used here:

- Quickstart: https://docs.ollama.com/quickstart
- API introduction: https://docs.ollama.com/api/introduction
- FAQ for `OLLAMA_HOST` and Windows environment variables: https://docs.ollama.com/faq

On each computer:

1. Download and install Ollama from `https://ollama.com/download`.
2. Open a terminal and verify installation:

```powershell
ollama -v
```

### Windows LAN configuration for Ollama

Ollama binds to `127.0.0.1:11434` by default. For LAN access, set `OLLAMA_HOST=0.0.0.0:11434`.

On each Ollama machine:

1. Quit Ollama from the tray.
2. Open Windows environment variables.
3. Add or edit these user variables:

```text
OLLAMA_HOST=0.0.0.0:11434
OLLAMA_NO_CLOUD=1
```

4. Start Ollama again from the Start menu.

### Pull the required model on each PC

On `PC-1`:

```powershell
ollama pull llama3
```

On `PC-2`:

```powershell
ollama pull mistral
```

### Verify each Ollama node locally

Run on each respective machine:

```powershell
ollama list
ollama ps
curl http://localhost:11434/api/tags
```

### Open Windows Firewall for Ollama

On each Ollama machine, allow inbound TCP port `11434`.

```powershell
New-NetFirewallRule -DisplayName "Ollama 11434" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 11434
```

### Verify Ollama over the network

From `PC-1`:

```powershell
curl http://192.168.0.10:11434/api/tags
curl http://192.168.0.11:11434/api/tags
```

## 2. Prepare the main server computer

The main server is the only machine that needs the AndATRA codebase.

Install backend and Telegram dependencies:

```powershell
cd C:\Users\Lev\Desktop\AndANTRA
python -m pip install -r backend\requirements.txt -r telegram\requirements.txt
```

## 3. Configure backend on the main server

Open `backend/.env` and use a LAN-ready configuration similar to this:

```env
FLASK_ENV=development
FLASK_SECRET_KEY=change_this_secret
DATABASE_URL=sqlite:///andatra.db
APP_HOST=0.0.0.0
APP_PORT=5000
FLASK_DEBUG=false
AUTO_SEED_REFERENCE_DATA=true
CORS_ORIGINS=http://localhost:3000,http://localhost:8081
SOCKETIO_ASYNC_MODE=threading

LLM_PRIMARY_URL=http://192.168.0.10:11434
LLM_CLASSIFY_URL=http://192.168.0.11:11434

LLM_PRIMARY_MODEL=llama3
LLM_CLASSIFY_MODEL=mistral

LLM_MOCK_MODE=false

TELEGRAM_BOT_SECRET=replace_with_your_shared_secret
```

Notes:

- `LLM_MOCK_MODE=false` enables real Ollama calls.
- `AUTO_SEED_REFERENCE_DATA=true` ensures categories and districts exist automatically.
- `SOCKETIO_ASYNC_MODE=threading` is the safest default for the current Windows/Python setup.

## 4. Configure Telegram bot on the main server

Open `telegram/.env` and set:

```env
TELEGRAM_BOT_TOKEN=replace_with_real_bot_token
BACKEND_URL=http://192.168.0.10:5000
BOT_SECRET=replace_with_your_shared_secret
```

## 5. Initialize and verify the backend

On `PC-1`:

```powershell
cd C:\Users\Lev\Desktop\AndANTRA\backend
python -m app.data.seed
python scripts\check_llm_nodes.py
```

You want both nodes to be reachable and exposing the configured model names.

## 6. Start the backend

```powershell
cd C:\Users\Lev\Desktop\AndANTRA\backend
python run.py
```

Quick checks:

```powershell
curl http://localhost:5000/api/health
curl http://localhost:5000/api/categories
```

## 7. Start the Telegram bot

```powershell
cd C:\Users\Lev\Desktop\AndANTRA\telegram
python -m bot.main
```

## 8. Optional: start the frontend

```powershell
cd C:\Users\Lev\Desktop\AndANTRA\frontend
npm install
npm start
```

## 9. Real end-to-end test

1. Backend running on `PC-1`
2. Telegram bot running on `PC-1`
3. Ollama running on both PCs
4. Send a new appeal to the Telegram bot
5. Check that the appeal appears in SQLite
6. Check that classification fields were updated

```powershell
python -c "import sqlite3; conn=sqlite3.connect(r'backend/instance/andatra.db'); cur=conn.cursor(); print(cur.execute('select id, citizen_telegram_id, text, category_id, priority, ai_summary, ai_tags from appeals order by id desc limit 5').fetchall())"
```

## 10. Troubleshooting

### LLM requests fall back or fail

Run:

```powershell
cd C:\Users\Lev\Desktop\AndANTRA\backend
python scripts\check_llm_nodes.py
```

If the specialized node is unavailable:

- `classification` falls back to `primary`

## 11. Recommended final production-like LAN layout

### PC-1

- Ollama model: `llama3`
- Runs:
  - backend
  - telegram
  - frontend
  - SQLite database

### PC-2

- Ollama model: `mistral`
- Runs:
  - only Ollama
