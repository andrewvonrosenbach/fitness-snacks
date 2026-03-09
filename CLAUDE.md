# Claude Instructions — fitness-snacks

## Autonomy
Work autonomously. Don't ask for confirmation on file edits, bash commands, running servers, git commits, or installing packages. Only pause for:
- Genuine feature/design decisions with no clear right answer
- Pushing to GitHub or other irreversible external actions
- Anything that costs money or touches external APIs beyond what's already in use

## Stack
- Frontend: React 18 via CDN (no build step), vanilla CSS, JSX via Babel standalone
- Backend: Vercel serverless functions in `/api`
- Storage: Redis via `ioredis` — connection via `process.env.REDIS_URL`
- Auth: shared password via `process.env.APP_PASSWORD`
- Deploy target: Vercel

## Rules
- Never hardcode secrets — always use `process.env.*`
- Never commit `.env`, `.env.local`, `.env*.local`, `PLAN.md.txt`, or `.claude/`
- No build step — keep it plain HTML/CSS/JS loadable without a bundler
- Don't add dependencies without a clear reason
- Keep Redis key schema consistent: `exercises:*`, `pods:*`, `history:*`
- Exercise library and pods are auto-seeded on first request via `api/_seed.js`

## Project context
Part of a personal app ecosystem. Each app is independently deployable. Friends may clone and run their own instances — code should be clean and self-contained.
