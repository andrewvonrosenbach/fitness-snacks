# Fitness Snacks — Setup

## Required Environment Variables

| Variable | Description |
|---|---|
| `APP_PASSWORD` | Shared password for accessing the app |
| `REDIS_URL` | Redis connection string (e.g. `redis://default:password@host:6379`) |

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the repo
3. Add environment variables in the Vercel dashboard:
   - `APP_PASSWORD` — choose any password
   - `REDIS_URL` — your Redis connection string (Upstash, Railway, etc.)
4. Deploy

## Run Locally

```bash
npm install -g vercel
npm install
vercel dev
```

Then open `http://localhost:3000`.

## Notes

- The exercise library and pods are **auto-seeded on first request** if Redis is empty
- Redis key schema: `exercises:{id}`, `exercises:all`, `pods:{id}`, `pods:all`, `pods:favorites`, `history:all`
- No build step — frontend is served as static files with React 18 via CDN
