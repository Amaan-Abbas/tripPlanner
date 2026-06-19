# TripPlanner.AI

AI-powered multi-agent trip planner with a Python FastAPI backend and a React + Vite frontend managed with Bun.

## What It Does

- Collects destination, duration, budget tier, travel style, interests, and constraints.
- Resolves real coordinates with Nominatim.
- Fetches forecast data from Open-Meteo.
- Fetches local points of interest from OpenStreetMap Overpass.
- Runs specialist Gemini-powered agents for destination research, weather guidance, attractions, budget, stays and transport, travel tips, and itinerary assembly.
- Streams agent progress to the UI with Server-Sent Events.
- Renders a dashboard with overview, attractions, day-by-day itinerary, stays and transit, budget, weather, travel tips, and export.

## Project Structure

```text
backend/
  main.py                  FastAPI app and /api endpoints
  coordinator.py           Multi-agent orchestration workflow
  agents/                  Agent state, prompts, and specialist modules
  services/                Nominatim, Open-Meteo, Overpass, Gemini clients
frontend/
  src/                     React application
  vite.config.js           Vite config and /api proxy to FastAPI
```

## Requirements

- Python 3.10+
- Bun
- Gemini API key from Google AI Studio

## Run Locally

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

In a second terminal:

```powershell
cd frontend
bun install
bun run dev
```

Open `http://localhost:5173`, save your Gemini API key in the UI settings panel, and submit a trip request.

## Verification

```powershell
python -m compileall backend
cd frontend
bun run lint
bun run build
```

The frontend sends the Gemini key to the local backend through the `X-Gemini-Api-Key` header. The key is stored only in browser local storage by the frontend.
