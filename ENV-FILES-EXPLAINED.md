# Environment Files Explained

## The Confusion

You have both `.env` and `.env.local` files, which can be confusing. Here's the explanation:

## File Breakdown

```
bengaluru-infra-aiagent/
├── .env.example         (Template - committed to Git)
├── .env                 (Production config - gitignored)
└── .env.local           (Local development - gitignored)
```

### 1. `.env.example` (2.3 KB)
- **Purpose:** Template with dummy values for documentation
- **Git Status:** ✅ Committed to repository
- **Contains:** Example configuration for all possible env variables
- **Usage:** Users copy this to `.env.local` to get started

### 2. `.env` (172 bytes)
- **Purpose:** Production or shared configuration
- **Git Status:** ❌ Gitignored (contains real credentials)
- **Contains:** 
  - DATABASE_URL (Supabase production)
  - CEREBRAS_API_KEY
- **Usage:** Production deployment or shared config

### 3. `.env.local` (2.4 KB)
- **Purpose:** Your local development configuration
- **Git Status:** ❌ Gitignored (contains real credentials)
- **Contains:** Full config with all services (SMTP, Twitter, etc.)
- **Usage:** Active config when running `pnpm dev`

## Next.js Loading Priority

Next.js loads environment files in this order (highest to lowest priority):

```
1. .env.local           ← Highest priority (your local overrides)
2. .env.development     ← If NODE_ENV=development
3. .env.production      ← If NODE_ENV=production
4. .env                 ← Base config
```

**In your case:**
- When you run `pnpm dev`, Next.js loads `.env.local` first
- If a variable is not in `.env.local`, it falls back to `.env`
- Your `.env` has minimal config (just DATABASE_URL + API key)
- Your `.env.local` has full config, so it takes precedence

## What Should You Do?

### Option 1: Keep both files (Current setup - RECOMMENDED)
```bash
# .env - Minimal production config
DATABASE_URL=postgresql://...supabase...
CEREBRAS_API_KEY=csk-...

# .env.local - Full local development config
DATABASE_URL=postgresql://localhost:5432/infra
CEREBRAS_API_KEY=csk-...
SMTP_HOST=localhost
SMTP_PORT=1025
# ... all other config
```

**Benefits:**
- Clean separation of production vs development
- Can switch between local and Supabase easily
- Follows Next.js best practices

### Option 2: Use only .env.local (Simpler)
```bash
# Delete .env and use only .env.local
rm .env

# Put everything in .env.local
# Switch configs by commenting/uncommenting
```

**Benefits:**
- Simpler - only one file to manage
- Less confusion about which file is loaded

## Security Note

Both `.env` and `.env.local` are in `.gitignore`, so they won't be committed. This is correct!

```bash
# From .gitignore:
.env*
!/.env.example  # Only .env.example is committed
```

## Recommendation

**Keep your current setup** - it's actually following best practices:
- `.env` = Production/Supabase (quick switch for testing prod DB)
- `.env.local` = Local development (your active config)

Just be aware that **`.env.local` takes priority** when both exist.

## Testing Which File is Active

```bash
# Check which DATABASE_URL is being used
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env.DATABASE_URL)"

# If you want to use .env instead, temporarily rename .env.local
mv .env.local .env.local.backup
pnpm dev  # Now it will use .env
```
