# AndATRA Frontend

Expo Router + React Native Web frontend for the AndATRA municipal analytics platform.

## Run

```bash
npm install
npm run web
```

## Environment

Copy `.env.example` to `.env` and adjust values if needed.

## Notes

- The app uses React Query for server state and Zustand for chat/UI state.
- If the backend is unavailable, services fall back to realistic mock data so the UI remains usable.
- Real-time updates are wired through `socket.io-client` and invalidate the appeals-related cache on `new_appeal`.
