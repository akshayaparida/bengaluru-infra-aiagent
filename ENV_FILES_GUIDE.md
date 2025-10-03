# .env vs .env.local - Which File to Use?

## Quick Answer

**Use `.env.local`** for your development configuration!

## Why?

### Next.js Priority Order:
```
.env              (lowest priority)
↓
.env.local        (higher priority) ← Next.js uses this in development
↓
.env.production   (production only)
↓
.env.development  (development only)
```

If the same variable exists in multiple files, the **higher priority** file wins.

## Your Current Setup

### ✅ `.env.local` (Next.js reads this)
- This is where Next.js looks for development configs
- Already has Twitter keys, MCP URL, etc.
- **I just updated it with correct email addresses**

### `.env` (Prisma CLI uses this)
- Prisma CLI specifically reads this for DATABASE_URL
- Keep DATABASE_URL here for Prisma migrations
- Also has CEREBRAS_API_KEY

### `.env.example`
- Template file (committed to git)
- Shows what variables are needed
- Developers copy this to create their own .env.local

## What's in .gitignore?

```bash
.env*              # All .env files ignored
!/.env.example     # Except .env.example (tracked in git)
```

So:
- ✅ `.env` - Ignored (safe)
- ✅ `.env.local` - Ignored (safe)  
- ✅ `.env.example` - Tracked in git (template only)

## Current Configuration

### `.env.local` NOW has:

**For Local Testing (Mailpit):**
```bash
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=blrinfraaiagent@gmail.com
NOTIFY_TO=akparida28@gmail.com
```

**For Real Gmail (commented out):**
```bash
# Uncomment these and add your App Password:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=blrinfraaiagent@gmail.com
# SMTP_PASSWORD=your_16_char_app_password_here
```

## To Enable Real Gmail Delivery

### Option A: Edit .env.local directly

1. Open `.env.local`
2. Find the "Option 2: Real Gmail SMTP" section (line 15-21)
3. Uncomment those lines (remove the `#`)
4. Add your Gmail App Password
5. Restart: `pnpm dev`

### Option B: Add to .env.local (append at end)

```bash
# Add these lines at the end of .env.local:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=blrinfraaiagent@gmail.com
SMTP_PASSWORD=your_16_char_app_password_here
FROM_EMAIL=blrinfraaiagent@gmail.com
NOTIFY_TO=akparida28@gmail.com
```

## Best Practices

### ✅ DO:
- Use `.env.local` for development secrets
- Use `.env` for Prisma DATABASE_URL
- Keep secrets out of git
- Use AWS Secrets Manager in production

### ❌ DON'T:
- Never commit .env or .env.local to git
- Never put real passwords in .env.example
- Don't hardcode secrets in source code

## Summary Table

| File | Used By | Committed to Git? | Purpose |
|------|---------|-------------------|---------|
| `.env` | Prisma CLI, Next.js | ❌ No | Database URL, shared configs |
| `.env.local` | Next.js | ❌ No | **Your development secrets (use this!)** |
| `.env.example` | Developers | ✅ Yes | Template/documentation |
| `.env.production` | Next.js prod | ❌ No | Production-only overrides |

## Your Action Items

1. ✅ Email addresses already updated in `.env.local`
2. ⏳ Get Gmail App Password from https://myaccount.google.com/apppasswords
3. ⏳ Uncomment Gmail SMTP section in `.env.local` (lines 16-21)
4. ⏳ Add your App Password
5. ⏳ Restart: `pnpm dev`
6. ⏳ Test and check akparida28@gmail.com inbox

**Current Status:** Email addresses correct, but using Mailpit (localhost). To get real emails, follow step 2-6 above!
