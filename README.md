# Tripify

Tripify is an AI-assisted travel planning app focused on budget-aware recommendations.

Built by students, for students.
The core use case is helping students plan realistic trips, including upcoming Spring Break travel, without blowing their budget.

It combines:
- User intent (destination, budget, days, people, preferences)
- Live provider signals when available (weather, places, pricing)
- Ranked recommendations plus AI explanation
- A frontend experience for onboarding, planning, and viewing trip-ready results

This README is written for hackathon judges to run and evaluate quickly.

## 1. What To Evaluate

Tripify should demonstrate:
1. Full-stack flow from account creation to generated travel plan
2. Preference-aware planning
3. Ranked recommendations with cost context
4. Graceful fallback behavior when external providers are unavailable

## 2. Tech Stack

- Frontend: React + Vite
- Backend: Spring Boot 3, PostgreSQL, Redis, Flyway
- AI Service: FastAPI + Ollama
- Infra: Docker Compose

## 3. Architecture And Ports

- Frontend dev server: `http://localhost:5173`
- Backend API: `http://localhost:8081`
- AI service: `http://localhost:8001`
- PostgreSQL: `localhost:5433`
- Redis: `localhost:6381`
- Ollama (host): `http://localhost:11434`

## 4. Prerequisites

Install:
1. Docker Desktop
2. Node.js 20+
3. Python 3.11+ (only needed for local AI service testing)
4. Java 17 (only needed for local backend testing outside Docker)
5. Ollama (recommended for best AI output)

## 5. Quick Start For Judges (Recommended Path)

### Step 1: Prepare environment file

From repo root:

```bash
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

### Step 2: Start backend stack

From repo root:

```bash
docker compose -f infra/compose/docker-compose.hybrid.yml up --build -d
```

On PowerShell (Windows path style also works):

```powershell
docker compose -f .\infra\compose\docker-compose.hybrid.yml up --build -d
```

### Step 3: Start frontend

In a new terminal:

```bash
cd frontend
npm install
VITE_API_BASE_URL=http://localhost:8081 npm run dev
```

On PowerShell:

```powershell
cd frontend
npm install
$env:VITE_API_BASE_URL="http://localhost:8081"; npm run dev
```

### Step 4: Open app

Open `http://localhost:5173`.

Expected first screen:
- A landing page with a **Get Started** button
- Clicking **Get Started** routes to the trip intent page ("Where are you traveling next?")

## 6. Ollama Setup (Optional But Recommended)

If Ollama is installed:

```bash
ollama --version
ollama pull llama3.2:3b
ollama serve
```

If `ollama` command is not on PATH in Windows, run:

```powershell
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" --version
& "$env:LOCALAPPDATA\Programs\Ollama\ollama.exe" pull llama3.2:3b
```

Quick health check:

```bash
curl http://localhost:11434/api/tags
```

Expected response contains `llama3.2:3b` in `models`.

## 7. Judge Demo Flow

Run this sequence in the UI:
1. Open `/` and click **Get Started**
2. Create account
3. Complete onboarding preferences
4. Open AI assistant page
5. Enter destination, budget, days, travelers, prompt
6. Build plan
7. Verify plan-ready screen shows:
   - Fixed Costs
   - Remaining Budget
   - Top Recommendations
   - Day-by-day cards

## 8. API Smoke Checks

Backend health:

```bash
curl http://localhost:8081/health
```

AI service health:

```bash
curl http://localhost:8001/health
```

Assistant endpoint sample:

```bash
curl -X POST http://localhost:8081/api/assistant/plan \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "destination": "Chicago",
    "budget": 1200,
    "days": 3,
    "people": 2,
    "prompt": "Plan a food-focused weekend",
    "origin": "Current location",
    "vibe": "foodie"
  }'
```

## 9. Evaluation Criteria Checklist

1. App boots end-to-end with documented commands
2. Auth + onboarding work
3. Assistant request returns structured plan data
4. Recommendations include cost and distance context
5. Plan-ready page renders recommendations and itinerary
6. Error states are understandable and non-blocking
7. External provider outage still allows a fallback plan

## 10. Fallback And Resilience Behavior

If external providers fail:
1. Backend can still return a generated fallback plan using ranked/synthetic data
2. Frontend surfaces clear error or demo-mode messaging
3. Users can still evaluate product flow without perfect provider availability

## 11. Troubleshooting

### Problem: Frontend calls wrong backend

Symptom:
- Requests go to old backend port or stale environment.

Fix:
1. Stop frontend dev server
2. Restart with explicit env

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8081 npm run dev
```

3. Hard refresh browser

### Problem: `Unsupported Database: PostgreSQL 16.x`

Fix:
- Ensure backend dependency includes `flyway-database-postgresql`
- Rebuild backend container

```bash
docker compose -f infra/compose/docker-compose.hybrid.yml up --build -d backend
```

### Problem: Ollama not reachable

Fix:
1. Start Ollama service
2. Verify `http://localhost:11434/api/tags` returns 200
3. Ensure model exists: `llama3.2:3b`

### Problem: `git pull` on `integration` not updating expected branch

Fix:

```bash
git branch --set-upstream-to=origin/integration integration
git pull
```

## 12. Useful Commands

Stop stack:

```bash
docker compose -f infra/compose/docker-compose.hybrid.yml down
```

Follow logs:

```bash
docker compose -f infra/compose/docker-compose.hybrid.yml logs -f backend ai-service
```

Run backend tests:

```bash
cd backend
./mvnw test
```

Run frontend build:

```bash
cd frontend
npm run build
```

Run AI service tests:

```bash
cd ai-service
pytest
```

## 13. Repository Structure

- `frontend/` React UI
- `backend/` Spring Boot API + ranking + persistence
- `ai-service/` FastAPI planner + Ollama integration
- `infra/compose/` Docker Compose definitions
- `.env.example` environment variable template
