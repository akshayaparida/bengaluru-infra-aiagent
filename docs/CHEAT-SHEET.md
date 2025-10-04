# Bengaluru Infrastructure AI Agent - Cheat Sheet

Quick reference for interviews and daily development.

---

## Architecture (30 seconds)

```
Citizen → Report Form → API → Postgres
                         ↓
            AI Classification (Cerebras)
                         ↓
            Email (Mailpit) + Twitter Bot
                         ↓
            Dashboard (Leaflet Map)
```

**Twitter Bot Flow**:
```
Cron (hourly) → Monitor @GBA_office → Classify → Generate Reply → Post
```

---

## Tech Stack (1 minute)

| Layer | Technology | Why? |
|-------|-----------|------|
| Frontend | Next.js 15 + React 19 | SSR, API routes, file-based routing |
| Styling | TailwindCSS | Utility-first, rapid dev |
| Backend | Next.js API Routes | Co-located with frontend |
| Database | PostgreSQL 17.5 + Prisma | ACID, type-safe ORM |
| Validation | Zod | TypeScript-first schemas |
| AI | Cerebras LLaMA + MCP | Fast inference, hackathon sponsor |
| Social | Twitter API v2 | Official API for monitoring |
| Maps | Leaflet | Lightweight, open-source |
| Email | Nodemailer + Mailpit | Local testing |
| Testing | Vitest + Playwright | Unit/integration + E2E |
| DevOps | Docker + pnpm | Consistent env, fast installs |

---

## Database Schema (1 minute)

```prisma
model Report {
  id              String       @id @default(cuid())
  createdAt       DateTime     @default(now())
  description     String       // Min 3 chars
  lat             Float        // -90 to 90
  lng             Float        // -180 to 180
  photoPath       String       // {timestamp}-{random}.jpg
  status          ReportStatus @default(NEW)
  category        String?      // pothole, garbage, water-leak, etc.
  severity        String?      // low, medium, high
  emailedAt       DateTime?
  emailMessageId  String?
  tweetedAt       DateTime?
  tweetId         String?
  
  @@index([createdAt])
}

enum ReportStatus {
  NEW      // Just submitted
  TRIAGED  // AI classified
  NOTIFIED // Email/tweet sent
}
```

---

## API Routes (2 minutes)

| Method | Endpoint | Purpose | Key Points |
|--------|----------|---------|------------|
| POST | `/api/reports` | Create report | Multipart, Zod validation, Sharp processing |
| GET | `/api/reports` | List reports | Pagination (max 100), search by description |
| GET | `/api/reports/:id/photo` | Get photo | Serve from `.data/uploads/` |
| POST | `/api/reports/:id/classify` | AI classify | Cerebras via MCP, fallback to simulated |
| POST | `/api/reports/:id/notify` | Send email | Mailpit SMTP, AI-crafted body |
| POST | `/api/reports/:id/tweet` | Post to Twitter | Rate limited |
| GET | `/api/transparency/budgets` | Budget data | Seeded JSON data |
| GET | `/api/health` | Health check | Postgres, Mailpit, MCP status |
| POST | `/api/cron/monitor-twitter` | Twitter bot | Hourly cron job |

**Example: Create Report**
```bash
curl -X POST http://localhost:3000/api/reports \
  -F description="Pothole on MG Road" \
  -F lat=12.9716 \
  -F lng=77.5946 \
  -F photo=@photo.jpg
# Response: { "id": "clxyz..." }
```

---

## Twitter Bot (2 minutes)

### Keywords by Category
```typescript
roads: ['pothole', 'road', 'highway', 'crack']
water: ['water', 'leak', 'pipeline', 'drainage']
waste: ['garbage', 'trash', 'dump', 'litter']
lighting: ['street light', 'lamp', 'dark']
parks: ['park', 'tree', 'garden']
```

### Severity Detection
```typescript
HIGH: ['urgent', 'emergency', 'danger', 'accident']
MEDIUM: ['please', 'fix', 'soon', 'days']
LOW: (default)
```

### Reply Template
```typescript
@GBA_office @ICCCBengaluru ${concernText} Please prioritize. ${hashtag}
```

**Example**:
```
@GBA_office @ICCCBengaluru URGENT: This road hazard on Indiranagar 100ft Road poses serious safety risk! Please prioritize this. #FixOurRoads
```

---

## Rate Limiting (1 minute)

### Twitter API Limits (Free Tier)
```
Mention Timeline: 3 calls / 15 min (96/day)
Post Tweet: 50 / 15 min (1,500/day)
User Lookup: 300 / 15 min
```

### Algorithm
```typescript
function canMakeCall(endpoint) {
  if (now - windowStart > 15 minutes) {
    reset window
  }
  return callsInWindow < limit;
}
```

### Storage
- **Local**: `.data/rate-limits.json`
- **Lambda**: DynamoDB
- **Vercel**: Vercel KV (Redis)

---

## Image Processing (1 minute)

### EXIF Rotation Problem
Mobile photos have EXIF orientation metadata. Without processing, they appear sideways.

### Solution
```typescript
await sharp(buffer)
  .rotate()              // Auto-rotates based on EXIF
  .jpeg({ quality: 90 }) // Convert to JPEG
  .toFile(outputPath);
```

---

## Testing (1 minute)

### Pyramid
```
E2E (5%): Playwright - Full user flows
Integration (25%): Vitest + MSW - API + DB
Unit (70%): Vitest - Pure functions
```

### Coverage Goals
- API Routes: 95%+
- Business Logic: 90%+
- Components: 80%+
- Overall: 85%+

### Run Tests
```bash
pnpm test              # Unit + integration
pnpm test:ui           # With UI
pnpm e2e               # Playwright
pnpm test --coverage   # Coverage report
```

---

## Deployment (2 minutes)

### Option 1: AWS Lambda (Recommended)
**Cost**: $1-5/month | **Setup**: 30 min

```
EventBridge (hourly) → Lambda → DynamoDB (rate limits)
                        ↓
                    Twitter API
```

**Key Services**: Lambda, EventBridge, DynamoDB, Secrets Manager, CloudWatch

### Option 2: Vercel (Easiest)
**Cost**: Free | **Setup**: 5 min

```bash
vercel --prod
vercel env add TWITTER_API_KEY
```

### Option 3: AWS EC2 (Traditional)
**Cost**: Free (12 mo), then $10/mo | **Setup**: 15 min

```bash
ssh ubuntu@ec2-ip
# Install Node.js, pnpm, pm2
pm2 start pnpm --name bengaluru-twitter -- start
crontab -e  # Add: 0 * * * * curl http://localhost:3000/api/cron/monitor-twitter
```

---

## Local Development (1 minute)

```bash
# 1. Setup
pnpm install
cp .env.example .env.local

# 2. Start services
docker compose up -d postgres mailpit mcp

# 3. Database
pnpm prisma migrate dev

# 4. Dev server
pnpm dev

# 5. Open
# App: http://localhost:3000
# Mailpit: http://localhost:8025
# Prisma Studio: pnpm exec prisma studio
```

---

## Environment Variables (1 minute)

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/infra

# Email
MAILPIT_HOST=localhost
MAILPIT_SMTP_PORT=1025

# AI
MCP_BASE_URL=http://localhost:8009
CEREBRAS_API_KEY=your_key

# Twitter
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_ACCESS_TOKEN=your_token
TWITTER_ACCESS_TOKEN_SECRET=your_token_secret
TWITTER_BEARER_TOKEN=your_bearer

# Flags
ENABLE_EMAIL=true
ENABLE_CLASSIFICATION=true
AUTO_POST_REPLY=false
MONITOR_HANDLES=@GBA_office,@ICCCBengaluru

# Storage
FILE_STORAGE_DIR=.data/uploads
```

---

## Security Checklist (1 minute)

✅ **Secrets**: Never commit `.env.local`, use `.env.example` for templates
✅ **Validation**: Zod schemas for all API inputs
✅ **File Uploads**: Type check (jpeg/png), safe filename generation, store outside `public/`
✅ **SQL Injection**: Use Prisma (parameterized queries)
✅ **Rate Limiting**: Track by IP, protect public APIs
✅ **HTTPS**: Force in production
✅ **Error Handling**: Never expose internal errors to users

---

## Common Commands (1 minute)

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm start            # Start production server

# Database
pnpm prisma migrate dev          # Create migration
pnpm prisma migrate deploy       # Apply migrations
pnpm prisma studio               # Database UI
pnpm prisma db push              # Sync schema (dev only)

# Testing
pnpm test                        # Run tests
pnpm test --watch               # Watch mode
pnpm e2e                        # E2E tests
pnpm test --coverage            # Coverage

# Docker
docker compose up -d            # Start all services
docker compose down             # Stop all services
docker compose ps               # List services
docker compose logs postgres    # View logs

# Linting
pnpm lint                       # ESLint
pnpm format                     # Prettier (if configured)
```

---

## Interview Quick Answers (2 minutes)

**Q: Why Next.js?**
A: Full-stack (frontend + backend), file-based routing, server components, built-in optimizations, easy deployment to Vercel.

**Q: Why Prisma?**
A: Type-safe ORM, auto-generated types, version-controlled migrations, prevents SQL injection, great DX with autocomplete.

**Q: How does rate limiting work?**
A: Window-based tracking. Store `{ callsInWindow, windowStart }`. Check if window expired (15 min). Reset if expired. Allow if under limit.

**Q: EXIF rotation issue?**
A: Mobile cameras save photos with EXIF orientation metadata. Use Sharp's `.rotate()` to physically rotate pixels based on EXIF data.

**Q: How to scale to 10K reports/day?**
A: 1) Read replicas for DB, 2) S3 + CDN for files, 3) Redis caching, 4) Queue system (Bull/SQS), 5) Load balancer with multiple instances.

**Q: How to handle Twitter API downtime?**
A: 1) Circuit breaker pattern, 2) Queue failed posts, 3) Dead letter queue for manual review, 4) Alert on sustained failures.

---

## File Structure (1 minute)

```
bengaluru-infra-aiagent/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API routes
│   │   │   ├── reports/          # CRUD operations
│   │   │   ├── cron/             # Scheduled jobs
│   │   │   ├── transparency/     # Budget data
│   │   │   └── health/           # Health checks
│   │   ├── dashboard/            # Dashboard page
│   │   ├── report/               # Report form page
│   │   └── (home)/               # Landing page
│   ├── lib/                      # Business logic
│   │   ├── classify.ts           # AI classification
│   │   ├── twitter-monitor.ts    # Twitter bot
│   │   ├── rate-limit-tracker.ts # Rate limiting
│   │   └── health.ts             # Health checks
│   ├── components/               # React components
│   └── types/                    # TypeScript types
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # DB migrations
├── tests/
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   └── e2e/                      # E2E tests
├── data/
│   └── seed/                     # Seed data (budgets)
├── .data/                        # Runtime data (gitignored)
│   ├── uploads/                  # Photo uploads
│   ├── rate-limits.json          # Rate limit state
│   └── processed-tweets.json     # Processed tweets
├── docs/                         # Documentation
├── mcp-gateway/                  # MCP Docker service
├── docker-compose.yml            # Local services
├── package.json                  # Dependencies
└── .env.local                    # Secrets (gitignored)
```

---

## Git Workflow (1 minute)

```bash
# Feature branch
git checkout -b feat/twitter-monitoring

# Work on feature...

# Add and commit (conventional commits)
git add src/lib/twitter-monitor.ts
git commit -m "feat: add Twitter monitoring service"

# Test before committing
pnpm test

# Push
git push -u origin feat/twitter-monitoring

# Create PR on GitHub
# After review and CI passes, merge to main
```

**Commit Prefixes**:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance
- `refactor:` Code restructure
- `perf:` Performance

---

## Troubleshooting (1 minute)

**Problem**: Docker services not starting
```bash
docker compose down
docker compose up -d
docker compose logs
```

**Problem**: Database connection error
```bash
# Check if Postgres is running
docker compose ps
# Check DATABASE_URL in .env.local
```

**Problem**: Twitter API rate limit
```bash
# Check rate limit state
cat .data/rate-limits.json
# Wait or reset
rm .data/rate-limits.json
```

**Problem**: Photos sideways
```bash
# Ensure Sharp is installed
pnpm add sharp
# Rebuild native modules
pnpm rebuild sharp
```

**Problem**: Tests failing
```bash
# Clear cache
rm -rf .next node_modules/.vitest
pnpm install
pnpm test
```

---

## Performance Tips (1 minute)

1. **Database**: Add indexes on frequently queried fields
2. **Images**: Use Sharp for compression, lazy load on frontend
3. **Caching**: Redis for dashboard data (5 min TTL)
4. **Bundle Size**: Use Next.js dynamic imports
5. **API**: Implement pagination, avoid N+1 queries
6. **Rate Limiting**: Conservative thresholds (80% of limit)

---

## Production Checklist (1 minute)

**Before Deploy**:
- [ ] All tests passing
- [ ] Environment variables set
- [ ] Secrets in Secrets Manager (not code)
- [ ] Rate limiter tested
- [ ] Error handling reviewed
- [ ] Logging configured
- [ ] Monitoring/alerts set up
- [ ] Backup strategy in place

**After Deploy**:
- [ ] Health check endpoint working
- [ ] Test one end-to-end flow
- [ ] Monitor logs for 24 hours
- [ ] Check costs daily for first week
- [ ] Set up billing alerts

---

## Key Metrics to Track (1 minute)

**Application**:
- Reports submitted per day
- Classification success rate
- Average response time
- Error rate

**Twitter Bot**:
- Mentions fetched per hour
- Complaints detected
- Replies posted
- API calls remaining

**Infrastructure**:
- Database query time
- Image processing time
- Storage usage
- API latency

---

## Resources (30 seconds)

**Documentation**:
- `/docs/SYSTEM-ARCHITECTURE-STUDY-GUIDE.md` - Full guide
- `/docs/POC.md` - Original POC plan
- `/docs/PRODUCTION-DEPLOYMENT.md` - Deployment guide
- `/docs/CHEAT-SHEET.md` - This file

**External**:
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Twitter API v2](https://developer.twitter.com/en/docs/twitter-api)
- [Leaflet Docs](https://leafletjs.com/reference.html)

---

## Quick Reference Cards

### Card 1: Architecture
```
Frontend (React) → API (Next.js) → DB (Postgres)
                      ↓
              AI (Cerebras) + Twitter Bot
```

### Card 2: Rate Limiting
```
canMakeCall() → Check window → Reset if expired → Allow if under limit
```

### Card 3: Testing Pyramid
```
       E2E (5%)
   Integration (25%)
      Unit (70%)
```

### Card 4: Deployment
```
Local: Docker Compose
Staging: Vercel
Prod: AWS Lambda + DynamoDB
```

---

**Last Updated**: Oct 4, 2025
**Time to Review**: 15 minutes
**Print this**: Keep for quick reference during interviews!
