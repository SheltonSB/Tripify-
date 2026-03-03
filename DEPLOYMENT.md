## Deploy Tripify

### Frontend: Vercel

Deploy the `frontend/` directory as the Vercel project root.

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable:
  - `VITE_API_BASE_URL=https://<your-render-backend-domain>`

The SPA rewrite config is already in [frontend/vercel.json](/Users/sheltonbumhe/Desktop/Tripify-/frontend/vercel.json).

### Backend + AI + Postgres: Render

Use the blueprint in [render.yaml](/Users/sheltonbumhe/Desktop/Tripify-/render.yaml).

It provisions:

- `tripify-postgres` managed Postgres
- `tripify-ai` private Docker service
- `tripify-backend` Docker web service

#### Required Render env values to fill in

Set these on the Render blueprint or service after sync:

- `TRIPIFY_OLLAMA_BASE_URL`
- `TRIPIFY_AMADEUS_CLIENT_ID`
- `TRIPIFY_AMADEUS_CLIENT_SECRET`
- `TRIPIFY_OPENWEATHER_API_KEY`
- `TRIPIFY_GOOGLE_PLACES_API_KEY`
- `TRIPIFY_TICKETMASTER_API_KEY`
- `TRIPIFY_YELP_API_KEY`

#### Database Connection Fix

If the backend fails with `Connection refused`, it likely needs the JDBC URL format.
Add this environment variable manually to the backend service:
- `SPRING_DATASOURCE_URL`: Copy the "Internal Connection String" from your PostgreSQL database (tripify-postgres), but replace `postgres://` with `jdbc:postgresql://`.

#### Important AI note

`tripify-ai` still needs a reachable Ollama-compatible endpoint. In production, point
`TRIPIFY_OLLAMA_BASE_URL` to a hosted Ollama/API endpoint your Render private service can reach.

### Deploy order

1. Deploy the Render blueprint.
2. Fill the missing Render env vars.
3. Wait for `tripify-ai` and `tripify-backend` to become healthy.
4. Deploy the frontend on Vercel with `VITE_API_BASE_URL` set to the Render backend URL.
