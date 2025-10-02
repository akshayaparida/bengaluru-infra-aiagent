# WARP.md

Bengaluru Infra AI Agent — local POC requirements (no deployment)

1) Reporter UI
- Capture GPS (browser geolocation) and camera/photo upload.
- Anonymous submitter.

2) Notifications + Social
- Auto email the respective authority (local demo uses Mailpit; recipients configurable).
- AI-crafted subject/body.
- X/Twitter autopost via MCP Gateway; allow simulation if credentials unavailable. Tag authorities where possible.
- Monitor social mentions (basic feed) for issues and suggestions; can be mocked if needed.

3) Dashboard + Transparency
- Map dashboard to track reported issues.
- Show basic budget/department/contractor mapping to highlight potential misuse (seeded demo data).
- Website post/social post from AI for transparency and engagement.

Constraints
- Sponsor tech: Cerebras LLaMA API + Docker MCP Gateway.
- Localhost only for demo; use pnpm; strict TS; TDD-first.
- No secrets in git; use .env.example.
