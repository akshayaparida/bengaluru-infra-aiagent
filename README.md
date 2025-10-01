# Bengaluru Infra AI Agent (Local POC)

This is a Next.js + TypeScript app that lets citizens report Bengaluru infrastructure issues with GPS + photo, automatically classifies them with Cerebras LLaMA, sends a local email (Mailpit) to the relevant authority, optionally simulates a tweet via MCP Gateway, and shows them on a Leaflet map dashboard. Everything runs in localhost for demo purposes.

## Quickstart (localhost only)

1) Copy environment variables (do not commit secrets)
```bash
cp .env.example .env
# edit .env locally; keep secrets out of git
```

2) Start services (Postgres, Mailpit, MCP Gateway)
```bash
docker compose up -d postgres mailpit mcp
```

3) Install dependencies and run app (pnpm only)
```bash
pnpm install
pnpm dev
```

4) Open UIs
- App: http://localhost:3000
- Mailpit: http://localhost:8025

5) Run tests
```bash
pnpm test
pnpm e2e
```

## Scripts
- dev: Next dev server (Turbopack)
- test: Vitest unit/integration
- e2e: Playwright end-to-end
- build/start: Next build/start

## Services (docker-compose)
- postgres: 17.5-alpine (database URL via `DATABASE_URL`)
- mailpit: SMTP (1025) + web UI (8025)
- mcp: Docker MCP Gateway (tools: email.send, social.tweet, storage.write, classify.report, mentions.fetch)

## Notes
- TDD-first: write tests before code; keep changes small and one-feature-per-PR.
- No secrets in git. Use `.env.example` as a reference only.
- Feature flags: TWEET_SIMULATE, FEATURE_MENTIONS to keep the demo stable.
- Images are stored locally under `public/uploads` for the POC.
