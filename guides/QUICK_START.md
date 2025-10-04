# 🚀 Quick Start Guide

## **Start Everything with AI (One Command)**

```bash
pnpm dev:all
```

That's it! This starts:
- ✅ Next.js server (port 3000)
- ✅ MCP Gateway AI (port 8009)
- ✅ Auto health checks
- ✅ Logging

## **Stop Everything**

```bash
pnpm stop
```

---

## Common Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev:all` | Start Next.js + AI together |
| `pnpm stop` | Stop all services |
| `pnpm dev` | Start Next.js only (without AI) |
| `pnpm dev:ai` | Start AI only |

---

## URLs

- **App**: http://localhost:3000
- **AI Health**: http://localhost:8009/health
- **API Health**: http://localhost:3000/api/health

---

## View Logs

```bash
# All logs
tail -f logs/*.log

# Next.js only
tail -f logs/nextjs.log

# AI only
tail -f logs/mcp-gateway.log
```

---

## Troubleshooting

**Problem:** Port already in use  
**Solution:** `pnpm stop` then `pnpm dev:all`

**Problem:** AI not working  
**Solution:** `curl http://localhost:8009/health`

**Problem:** Need to restart  
**Solution:** `pnpm stop && pnpm dev:all`

---

## What Changed?

### Before:
```bash
# Had to manually start AI every time
node mcp-gateway/server.js  # Terminal 1
pnpm dev                     # Terminal 2
```

### After:
```bash
# Everything starts automatically!
pnpm dev:all
```

---

## Read More

- **Full Guide**: `AUTO_START_AI.md`
- **MCP Gateway Explained**: `MCP_GATEWAY_EXPLAINED.md`
- **Email Setup**: `ENABLE_REAL_EMAIL.md`
- **Server Status**: `SERVER_STATUS.md`
