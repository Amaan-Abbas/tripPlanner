# TripPlanner.AI Frontend

React + Vite interface for the multi-agent TripPlanner backend.

## Scripts

```powershell
bun install
bun run dev
bun run lint
bun run build
```

The Vite dev server proxies `/api` to `http://localhost:8000`, where the FastAPI backend should be running.

## UI Flow

- Save a Gemini API key in the settings panel.
- Complete the trip preference form.
- Watch the agent execution graph and streaming console logs.
- Review the completed dashboard tabs and export the itinerary.
