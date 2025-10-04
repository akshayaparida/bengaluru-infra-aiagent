# Study Flashcards - Bengaluru Infrastructure AI Agent

Total Cards: 60 | Estimated Study Time: 30 minutes

---

## Technology Stack

### Card 1
**Q**: Why did we choose Next.js 15 over plain React or Express?

<details>
<summary>Answer</summary>

**Full-stack framework**: Frontend + Backend in one codebase
- File-based routing for APIs
- Server components reduce client JS
- Built-in image optimization
- Easy Vercel deployment
- SSR + SSG capabilities
</details>

---

### Card 2
**Q**: Why Prisma ORM instead of raw SQL queries?

<details>
<summary>Answer</summary>

**Type safety + Developer Experience**:
- Auto-generated types match database schema
- Version-controlled migrations
- Prevents SQL injection (parameterized queries)
- Autocomplete and IntelliSense
- Easy refactoring
- Database-agnostic
</details>

---

### Card 3
**Q**: What is the EXIF rotation problem and how did we solve it?

<details>
<summary>Answer</summary>

**Problem**: Mobile cameras save photos with EXIF orientation metadata instead of rotating pixels. Photos appear sideways in browser.

**Solution**: Use Sharp library
```typescript
await sharp(buffer)
  .rotate()  // Auto-rotates based on EXIF Orientation tag
  .jpeg({ quality: 90 })
  .toFile(outputPath);
```
</details>

---

### Card 4
**Q**: What are the Twitter API Free Tier limits?

<details>
<summary>Answer</summary>

**Rate Limits**:
- Mention Timeline: **3 calls per 15 minutes** (96/day)
- Post Tweet: **50 per 15 minutes** (1,500/day)
- User Lookup: **300 per 15 minutes**

**Why this matters**: Must implement rate limiting to avoid temporary bans
</details>

---

### Card 5
**Q**: List all the technologies in our stack (name at least 8).

<details>
<summary>Answer</summary>

1. **Next.js 15** - Framework
2. **React 19** - UI library
3. **TypeScript** - Type safety
4. **PostgreSQL 17.5** - Database
5. **Prisma** - ORM
6. **Zod** - Validation
7. **Cerebras LLaMA** - AI
8. **Twitter API v2** - Social
9. **Leaflet** - Maps
10. **Vitest** - Testing
11. **Playwright** - E2E testing
12. **Docker** - Containers
13. **Sharp** - Image processing
14. **TailwindCSS** - Styling
</details>

---

## Architecture & Design

### Card 6
**Q**: Draw the high-level system architecture from memory.

<details>
<summary>Answer</summary>

```
┌─────────────────────────────────────┐
│ Citizen (Browser)                   │
└────────────┬────────────────────────┘
             │ GPS + Photo + Description
             ▼
┌─────────────────────────────────────┐
│ Next.js Frontend (React)            │
└────────────┬────────────────────────┘
             │ HTTP POST
             ▼
┌─────────────────────────────────────┐
│ Next.js API Routes                  │
│ - Zod validation                    │
│ - Image processing (Sharp)          │
└────────────┬────────────────────────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
┌─────┐  ┌─────┐  ┌─────────┐
│ DB  │  │Files│  │External │
│(PG) │  │(.data)│ │APIs     │
└─────┘  └─────┘  └─────────┘
```
</details>

---

### Card 7
**Q**: What are the 3 ReportStatus enum values and what do they mean?

<details>
<summary>Answer</summary>

1. **NEW**: Just submitted, no processing yet
2. **TRIAGED**: AI has classified (category + severity assigned)
3. **NOTIFIED**: Email/tweet sent to authorities

**Flow**: NEW → TRIAGED → NOTIFIED
</details>

---

### Card 8
**Q**: Explain the rate limiting algorithm in 5 steps.

<details>
<summary>Answer</summary>

**Window-Based Algorithm**:
1. Check current time vs `windowStart`
2. If > 15 minutes, **reset** `callsInWindow = 0`, update `windowStart`
3. If `callsInWindow < limit`, **allow** the call
4. If at limit, calculate wait time: `windowEnd - now`
5. **Record** call and save state to disk/DB
</details>

---

### Card 9
**Q**: What are all the API endpoints? (Name at least 7)

<details>
<summary>Answer</summary>

1. `POST /api/reports` - Create report
2. `GET /api/reports` - List reports
3. `GET /api/reports/:id/photo` - Get photo
4. `POST /api/reports/:id/classify` - AI classify
5. `POST /api/reports/:id/notify` - Send email
6. `POST /api/reports/:id/tweet` - Post to Twitter
7. `GET /api/transparency/budgets` - Budget data
8. `GET /api/health` - Health check
9. `POST /api/cron/monitor-twitter` - Twitter bot
</details>

---

### Card 10
**Q**: What fields does the Report model have? (Name at least 8)

<details>
<summary>Answer</summary>

**Required**:
- `id` (String, CUID)
- `createdAt` (DateTime)
- `description` (String)
- `lat` (Float)
- `lng` (Float)
- `photoPath` (String)
- `status` (ReportStatus enum)

**Optional**:
- `category` (String?)
- `severity` (String?)
- `emailedAt` (DateTime?)
- `emailMessageId` (String?)
- `tweetedAt` (DateTime?)
- `tweetId` (String?)
</details>

---

## Database & Storage

### Card 11
**Q**: Why do we use CUID for IDs instead of auto-incrementing integers?

<details>
<summary>Answer</summary>

**CUID Advantages**:
- **Collision-resistant**: Globally unique
- **Sortable**: Timestamp-based prefix
- **URL-safe**: No special characters
- **Secure**: Not sequential (can't guess next ID)
- **Distributed-friendly**: Works across multiple servers

Example: `clxyz12345abcd`
</details>

---

### Card 12
**Q**: What validations do we apply to GPS coordinates?

<details>
<summary>Answer</summary>

**Zod Schema**:
```typescript
lat: z.coerce.number().min(-90).max(90)
lng: z.coerce.number().min(-180).max(180)
```

**Why**: Valid GPS coordinates range:
- Latitude: -90 to 90 (North/South poles)
- Longitude: -180 to 180 (Date line)
</details>

---

### Card 13
**Q**: Where do we store uploaded photos and why there?

<details>
<summary>Answer</summary>

**Local Dev**: `.data/uploads/` directory

**Why**:
- Outside `public/` folder (no direct access)
- Gitignored (not in version control)
- Served via API route with access control
- Easy to migrate to S3 in production

**Filename Format**: `{timestamp}-{random}.jpg`
</details>

---

### Card 14
**Q**: What database index do we create and why?

<details>
<summary>Answer</summary>

**Primary Index**:
```prisma
@@index([createdAt])
```

**Why**: Dashboard queries `ORDER BY createdAt DESC` to show newest reports first. Index makes this fast.

**Future Indexes** (production):
- `status` - Filter by status
- `category` - Filter by category
- `(lat, lng)` - Geospatial queries (PostGIS)
</details>

---

## AI & Classification

### Card 15
**Q**: What are the 6 report categories we classify into?

<details>
<summary>Answer</summary>

1. **pothole** - Road damage, cracks
2. **streetlight** - Broken/dark lights
3. **garbage** - Waste accumulation
4. **water-leak** - Pipeline leaks
5. **tree** - Fallen trees, overgrown branches
6. **traffic** - Default/fallback category
</details>

---

### Card 16
**Q**: What are the 3 severity levels and how do we determine them?

<details>
<summary>Answer</summary>

**Severity Levels**:
1. **high** - Keywords: urgent, emergency, danger, accident, injury, critical
2. **medium** - Keywords: please, fix, soon, days, weeks, month
3. **low** - Default (no priority keywords found)

**Detection**: Simple keyword matching in description text
</details>

---

### Card 17
**Q**: What is MCP Gateway and why do we use it?

<details>
<summary>Answer</summary>

**MCP** = Model Context Protocol

**What**: Abstraction layer for AI tools
**Why**: 
- Unified interface for different AI models
- Easy to swap providers (Cerebras → OpenAI)
- Simulation mode for testing
- Tool-based API design

**Tools Available**:
- `classify.report` - Categorize issues
- `email.send` - Generate emails
- `social.tweet` - Post to Twitter
</details>

---

### Card 18
**Q**: What happens if AI classification fails?

<details>
<summary>Answer</summary>

**Graceful Degradation**:
```typescript
try {
  return await classifyViaMcp(description, mcpBaseUrl);
} catch (error) {
  logger.warn('MCP failed, using simulated');
  return classifySimulated(description);  // Fallback
}
```

**Simulated**: Keyword-based matching
- Search for "pothole" → category: pothole
- Search for "huge" → severity: high
</details>

---

## Twitter Bot

### Card 19
**Q**: What Twitter handles does the bot monitor and how often?

<details>
<summary>Answer</summary>

**Monitored Handles**:
- `@GBA_office` (Government Body)
- `@ICCCBengaluru` (Traffic Police)

**Frequency**: Every hour (cron job)

**Why these**: Official Bengaluru government accounts that receive citizen complaints
</details>

---

### Card 20
**Q**: List the 5 infrastructure keyword categories for Twitter monitoring.

<details>
<summary>Answer</summary>

**1. Roads**: pothole, road, highway, street, patch, crack, damage
**2. Water**: water, leak, pipeline, supply, drainage, sewage
**3. Waste**: garbage, waste, trash, dustbin, litter, dump
**4. Lighting**: street light, lamp, dark, lighting, bulb
**5. Parks**: park, tree, garden, playground, green
</details>

---

### Card 21
**Q**: How does the bot extract location from tweets?

<details>
<summary>Answer</summary>

**Regex Pattern**:
```regex
/(?:at|near|on|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Road|Street|Avenue|Layout|Nagar))/i
```

**Examples**:
- "pothole **on Indiranagar 100ft Road**" → "Indiranagar 100ft Road"
- "garbage **near MG Road**" → "MG Road"
- "leak **at Koramangala 5th Block**" → "Koramangala 5th Block"
</details>

---

### Card 22
**Q**: What does a generated Twitter reply look like?

<details>
<summary>Answer</summary>

**Template**:
```
@GBA_office @ICCCBengaluru {concernText} Please prioritize this. {hashtag}
```

**Example (High Severity Road)**:
```
@GBA_office @ICCCBengaluru URGENT: This road hazard on Indiranagar 100ft Road poses serious safety risk to commuters and pedestrians! Please prioritize this. #FixOurRoads
```

**Components**:
- Mention both government handles
- Context-aware concern (varies by category/severity)
- Location if detected
- Category-specific hashtag
- Under 280 characters
</details>

---

### Card 23
**Q**: What data do we track for processed tweets?

<details>
<summary>Answer</summary>

**File**: `.data/processed-tweets.json`

**Fields**:
```json
{
  "id": "1234567890",         // Tweet ID
  "processedAt": "2025-10-04T10:30:00Z",
  "repliedAt": "2025-10-04T10:31:00Z",
  "replyId": "0987654321",    // Our reply tweet ID
  "category": "roads",
  "severity": "high"
}
```

**Why**: Avoid processing same tweet twice, analytics, audit trail
</details>

---

### Card 24
**Q**: What are the 5 steps in the Twitter monitoring flow?

<details>
<summary>Answer</summary>

1. **Rate Limit Check** - Can we make API calls?
2. **Fetch Mentions** - Get tweets mentioning government handles
3. **Filter** - Recent (2 hours) + unprocessed only
4. **Classify** - Extract category, severity, location
5. **Reply** - Generate and post response (if enabled)
</details>

---

## Testing

### Card 25
**Q**: What is the testing pyramid and our coverage targets?

<details>
<summary>Answer</summary>

```
       E2E (5%)     - Playwright - 5% of tests
   Integration (25%) - Vitest + MSW - 25% of tests
      Unit (70%)     - Vitest - 70% of tests
```

**Coverage Targets**:
- API Routes: 95%+
- Business Logic: 90%+
- Components: 80%+
- **Overall: 85%+**
</details>

---

### Card 26
**Q**: What testing tools do we use and for what?

<details>
<summary>Answer</summary>

**Vitest**:
- Unit tests (pure functions)
- Integration tests (API + DB)
- Fast, TypeScript support, watch mode

**Playwright**:
- E2E tests (full browser flows)
- Cross-browser testing
- Screenshots, auto-wait

**MSW** (Mock Service Worker):
- Mock external APIs (Twitter, Cerebras)
- Network-level interception
- Works in Node and browser
</details>

---

### Card 27
**Q**: Give an example of a unit test and integration test.

<details>
<summary>Answer</summary>

**Unit Test** (pure function):
```typescript
test('should classify pothole', () => {
  const result = classifySimulated('Huge pothole');
  expect(result.category).toBe('pothole');
  expect(result.severity).toBe('high');
});
```

**Integration Test** (API + DB):
```typescript
test('POST /api/reports creates report', async () => {
  const formData = new FormData();
  formData.append('description', 'Pothole');
  formData.append('lat', '12.9716');
  formData.append('lng', '77.5946');
  formData.append('photo', file);
  
  const res = await fetch('/api/reports', { 
    method: 'POST', 
    body: formData 
  });
  
  expect(res.status).toBe(201);
  expect(await res.json()).toHaveProperty('id');
});
```
</details>

---

### Card 28
**Q**: What commands do we use to run tests?

<details>
<summary>Answer</summary>

```bash
# All unit + integration
pnpm test

# Watch mode (re-run on file change)
pnpm test --watch

# With UI (browser interface)
pnpm test:ui

# Coverage report
pnpm test --coverage

# E2E tests
pnpm e2e

# E2E with visible browser
pnpm exec playwright test --headed
```
</details>

---

## DevOps & Deployment

### Card 29
**Q**: What are the 3 deployment options and their costs?

<details>
<summary>Answer</summary>

**1. AWS Lambda** (Recommended)
- Cost: $1-5/month
- Setup: 30 minutes
- Serverless, auto-scaling

**2. Vercel** (Easiest)
- Cost: Free (Hobby plan)
- Setup: 5 minutes
- One-command deploy

**3. AWS EC2** (Traditional)
- Cost: Free (12 mo), then $10/mo
- Setup: 15 minutes
- Full control, like your laptop
</details>

---

### Card 30
**Q**: What AWS services do we use for Lambda deployment?

<details>
<summary>Answer</summary>

1. **AWS Lambda** - Run monitoring code
2. **EventBridge** - Cron trigger (hourly)
3. **DynamoDB** - Rate limit storage (key-value)
4. **Secrets Manager** - Store API keys securely
5. **CloudWatch Logs** - Logging and monitoring
6. **IAM** - Permissions and roles
</details>

---

### Card 31
**Q**: What Docker services do we run locally?

<details>
<summary>Answer</summary>

**docker-compose.yml**:

1. **postgres:17.5-alpine** (Port 5432)
   - Database
   
2. **mailpit** (Ports 8025, 1025)
   - SMTP server + Web UI for emails
   
3. **mcp** (Port 8009)
   - MCP Gateway for AI tools

**Start**: `docker compose up -d`
**Stop**: `docker compose down`
</details>

---

### Card 32
**Q**: What are the key environment variables we need?

<details>
<summary>Answer</summary>

**Database**:
- `DATABASE_URL`

**Twitter API** (5 keys):
- `TWITTER_API_KEY`
- `TWITTER_API_SECRET`
- `TWITTER_ACCESS_TOKEN`
- `TWITTER_ACCESS_TOKEN_SECRET`
- `TWITTER_BEARER_TOKEN`

**AI**:
- `CEREBRAS_API_KEY`
- `MCP_BASE_URL`

**Feature Flags**:
- `AUTO_POST_REPLY`
- `MONITOR_HANDLES`

**Never commit** `.env.local`! Use `.env.example` as template.
</details>

---

### Card 33
**Q**: What is the local development setup process? (7 steps)

<details>
<summary>Answer</summary>

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Start Docker services
docker compose up -d postgres mailpit mcp

# 4. Run database migrations
pnpm prisma migrate dev

# 5. (Optional) Seed data
pnpm prisma db seed

# 6. Start dev server
pnpm dev

# 7. Open browser
# http://localhost:3000 - App
# http://localhost:8025 - Mailpit
```
</details>

---

### Card 34
**Q**: How do we deploy to Vercel?

<details>
<summary>Answer</summary>

```bash
# 1. Install Vercel CLI
pnpm add -g vercel

# 2. Login
vercel login

# 3. Deploy to production
vercel --prod

# 4. Set environment variables
vercel env add TWITTER_API_KEY
vercel env add TWITTER_API_SECRET
# ... (repeat for all secrets)

# 5. Enable Vercel KV for rate limiting
# (Via Vercel dashboard: Storage → Create KV Database)
```

**Cron**: Add `vercel.json` with cron schedule
</details>

---

## Security & Best Practices

### Card 35
**Q**: What are the top 5 security practices we follow?

<details>
<summary>Answer</summary>

1. **Secrets**: Never commit `.env.local`, use Secrets Manager in prod
2. **Validation**: Zod schemas for all API inputs
3. **File Uploads**: Type check (jpeg/png only), safe filenames, outside `public/`
4. **SQL Injection**: Use Prisma (parameterized queries)
5. **Error Handling**: Never expose internal errors to users
</details>

---

### Card 36
**Q**: How do we secure file uploads?

<details>
<summary>Answer</summary>

**4-Layer Security**:

1. **Type Check**:
```typescript
const allowed = ['image/jpeg', 'image/png'];
if (!allowed.includes(photo.type)) throw new Error();
```

2. **Safe Filename** (no user input):
```typescript
const fileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.jpg`;
```

3. **Storage Location** (outside public):
```typescript
const storageDir = '.data/uploads';  // Not in public/
```

4. **Serve via API** (access control):
```typescript
GET /api/reports/:id/photo  // Check authorization
```
</details>

---

### Card 37
**Q**: What validations does Zod apply to report creation?

<details>
<summary>Answer</summary>

```typescript
const schema = z.object({
  description: z.string().min(3, 'too short'),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180)
});
```

**Validates**:
- Description length (min 3 chars)
- GPS coordinates within valid range
- Type coercion (string → number for lat/lng)

**Returns**: Detailed error messages on failure
</details>

---

### Card 38
**Q**: What Git commit convention do we follow?

<details>
<summary>Answer</summary>

**Conventional Commits**:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance
- `refactor:` Code restructure
- `perf:` Performance improvement

**Examples**:
```bash
git commit -m "feat: add Twitter monitoring system"
git commit -m "fix: resolve EXIF rotation issue"
git commit -m "docs: update deployment guide"
```
</details>

---

## Performance & Optimization

### Card 39
**Q**: How would you scale this to handle 10,000 reports per day?

<details>
<summary>Answer</summary>

**6-Point Scaling Strategy**:

1. **Database**: Read replicas for GET queries
2. **File Storage**: S3 + CloudFront CDN
3. **Caching**: Redis for dashboard (5 min TTL)
4. **Queue System**: Bull/BullMQ for async processing
5. **Load Balancing**: Multiple Next.js instances behind ALB
6. **Indexing**: Add indexes on lat/lng (PostGIS), status, category
</details>

---

### Card 40
**Q**: What performance optimizations did we implement?

<details>
<summary>Answer</summary>

**1. Image Processing**: Sharp (fast, native)
**2. Database Index**: On `createdAt` for fast sorting
**3. Pagination**: Max 100 reports per request
**4. Rate Limiting**: Conservative thresholds (80% of limit)
**5. Connection Pooling**: Prisma manages connections
**6. Lazy Loading**: Images load on demand
**7. Code Splitting**: Next.js automatic
</details>

---

## Problem Solving

### Card 41
**Q**: How do we handle Twitter API downtime?

<details>
<summary>Answer</summary>

**Resilience Strategy**:

1. **Circuit Breaker**: Stop calling after N failures
2. **Queue System**: Store failed posts in queue
3. **Dead Letter Queue**: Manual review for persistent failures
4. **Graceful Degradation**: App continues accepting reports
5. **Monitoring**: Alert on sustained API errors
6. **Retry Logic**: Exponential backoff (1s, 2s, 4s, 8s)
</details>

---

### Card 42
**Q**: How do we ensure data consistency?

<details>
<summary>Answer</summary>

**4 Strategies**:

1. **ACID Transactions**: Postgres guarantees atomicity
2. **Optimistic Locking**: Prisma `@@version` field
3. **Idempotency**: Check for duplicate reports (same GPS + 5min window)
4. **Retry Logic**: Exponential backoff for external API calls

**Example**: If photo upload fails, rollback DB record
</details>

---

### Card 43
**Q**: What happens if Cerebras AI API is down?

<details>
<summary>Answer</summary>

**Fallback Chain**:

```typescript
try {
  // 1. Try Cerebras via MCP
  return await classifyViaMcp(description);
} catch (error) {
  logger.warn('MCP failed, using simulated');
  // 2. Fall back to keyword matching
  return classifySimulated(description);
}
```

**Result**: System always classifies, even if AI is down
**Trade-off**: Simulated classification less accurate
</details>

---

### Card 44
**Q**: How do we prevent duplicate tweet processing?

<details>
<summary>Answer</summary>

**3-Step Prevention**:

1. **Track Processed**: Store tweet IDs in `.data/processed-tweets.json`
2. **Check Before Processing**: 
   ```typescript
   if (processedTweets.includes(tweet.id)) continue;
   ```
3. **Time Window**: Only process tweets from last 2 hours

**Why**: Avoid spamming same reply, save API calls
</details>

---

### Card 45
**Q**: What monitoring metrics should we track in production?

<details>
<summary>Answer</summary>

**Application Metrics**:
- Reports submitted per day
- Classification success rate
- Average API response time
- Error rate

**Twitter Bot Metrics**:
- Mentions fetched per hour
- Complaints detected
- Replies posted
- API calls remaining

**Infrastructure Metrics**:
- Database query time
- Storage usage
- CPU/Memory usage
- API latency (p50, p95, p99)
</details>

---

## Advanced Topics

### Card 46
**Q**: How would you implement geospatial search (find reports within 5km)?

<details>
<summary>Answer</summary>

**PostGIS Extension**:

```sql
-- 1. Add PostGIS extension
CREATE EXTENSION postgis;

-- 2. Add geography column
ALTER TABLE "Report" 
ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- 3. Create spatial index
CREATE INDEX idx_report_location 
ON "Report" USING GIST (location);

-- 4. Query within 5km
SELECT * FROM "Report"
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326),
  5000  -- meters
);
```
</details>

---

### Card 47
**Q**: What databases would you use for different use cases?

<details>
<summary>Answer</summary>

**Use Case → Database**:

- **Reports**: PostgreSQL (relational, ACID, geospatial)
- **Rate Limits**: Redis (fast, ephemeral, in-memory)
- **User Sessions**: Redis with TTL
- **Analytics**: ClickHouse (columnar, fast aggregations)
- **File Metadata**: PostgreSQL
- **Full-Text Search**: Elasticsearch
- **Time-Series**: InfluxDB or TimescaleDB
</details>

---

### Card 48
**Q**: What is a Circuit Breaker pattern and when would we use it?

<details>
<summary>Answer</summary>

**Circuit Breaker**: Stops calling failing service after threshold

**States**:
1. **Closed**: Normal operation
2. **Open**: Stop calling after N failures
3. **Half-Open**: Try one request after timeout

**Use Cases**:
- Twitter API calls
- Cerebras AI requests
- Email sending

**Implementation**:
```typescript
if (failureCount > 5) {
  circuit = 'OPEN';
  return fallback();
}
```
</details>

---

### Card 49
**Q**: How would you implement real-time notifications to citizens?

<details>
<summary>Answer</summary>

**WebSocket Solution**:

1. **Backend**: Socket.io server in Next.js
2. **Frontend**: Socket.io client
3. **Events**: 
   - `report:classified` - AI classification done
   - `report:notified` - Email sent
   - `report:resolved` - Issue fixed
4. **Rooms**: Subscribe to specific report IDs
5. **Fallback**: HTTP polling every 30s

**Alternative**: Server-Sent Events (SSE) for one-way updates
</details>

---

### Card 50
**Q**: What's the difference between unit, integration, and E2E tests? Give examples.

<details>
<summary>Answer</summary>

**Unit Test** (isolated function):
```typescript
test('classify pothole', () => {
  expect(classifySimulated('pothole')).toEqual({
    category: 'pothole', severity: 'medium'
  });
});
```

**Integration Test** (API + DB):
```typescript
test('POST /api/reports creates DB record', async () => {
  const res = await POST('/api/reports', formData);
  expect(res.status).toBe(201);
  const report = await prisma.report.findUnique({ id: res.id });
  expect(report).toBeDefined();
});
```

**E2E Test** (full user flow):
```typescript
test('user submits report and sees on dashboard', async ({ page }) => {
  await page.goto('/report');
  await fillForm();
  await page.click('Submit');
  await page.waitForURL('/dashboard');
  await expect(page.locator('.leaflet-marker')).toBeVisible();
});
```
</details>

---

## Interview Prep

### Card 51
**Q**: Explain this project in 30 seconds (elevator pitch).

<details>
<summary>Answer</summary>

"I built a full-stack infrastructure reporting system for Bengaluru citizens. Users submit complaints with GPS and photos, AI classifies them using Cerebras LLaMA, and the system auto-notifies government departments via email. I also built a Twitter bot that monitors government handles, detects infrastructure complaints, and auto-replies with support. The tech stack is Next.js, React, Postgres, Prisma, and Twitter API v2, with comprehensive testing and production-ready AWS deployment options."
</details>

---

### Card 52
**Q**: What was the most challenging part of this project?

<details>
<summary>Answer</summary>

**Twitter API Rate Limiting**: Free tier only allows 3 mention timeline calls per 15 minutes. 

**Solution**: Built a window-based rate limiter that:
- Tracks API usage per endpoint
- Automatically waits when limits are hit
- Persists state across cron runs
- Has 80% safety threshold to prevent hard limits

**Learning**: Real-world API constraints require thoughtful architecture, not just coding.
</details>

---

### Card 53
**Q**: How did you ensure code quality?

<details>
<summary>Answer</summary>

**5-Point Quality Strategy**:

1. **TypeScript Strict Mode**: Catch errors at compile time
2. **TDD Approach**: Write tests first, then code
3. **85%+ Code Coverage**: Vitest for unit/integration
4. **E2E Tests**: Playwright for critical flows
5. **Code Review**: Git workflow with PRs

**Result**: Confidence to deploy to production
</details>

---

### Card 54
**Q**: What would you do differently in a production rewrite?

<details>
<summary>Answer</summary>

**Improvements**:

1. **Event-Driven Architecture**: Use queues (SQS, Bull) for async processing
2. **Microservices**: Separate Twitter bot into its own service
3. **GraphQL**: More flexible API than REST
4. **Real-Time**: WebSockets for live updates
5. **Multi-Tenancy**: Support multiple cities
6. **Mobile App**: React Native for better UX
7. **Analytics Dashboard**: Admin panel with metrics
8. **CI/CD**: GitHub Actions for automated deployments
</details>

---

### Card 55
**Q**: How does this project demonstrate production-ready skills?

<details>
<summary>Answer</summary>

**Production Skills**:

1. **Error Handling**: Graceful degradation, fallbacks
2. **Monitoring**: CloudWatch logs, custom metrics
3. **Security**: No secrets in code, input validation
4. **Testing**: 85%+ coverage, E2E tests
5. **DevOps**: Docker, AWS Lambda deployment
6. **Rate Limiting**: Respect API constraints
7. **Database Design**: Proper indexes, migrations
8. **Code Quality**: TypeScript strict, linting
</details>

---

### Card 56
**Q**: What technologies would you add for a startup scaling to 100K users?

<details>
<summary>Answer</summary>

**Scaling Tech Stack**:

1. **Caching**: Redis (in-memory)
2. **CDN**: CloudFlare for images
3. **Queue**: Bull/SQS for async jobs
4. **Search**: Elasticsearch for full-text
5. **Monitoring**: Datadog or New Relic
6. **Error Tracking**: Sentry
7. **Load Balancer**: AWS ALB
8. **Auto-Scaling**: ECS/EKS
9. **Database**: Read replicas, connection pooling
10. **Analytics**: Mixpanel or Amplitude
</details>

---

### Card 57
**Q**: Explain the trade-offs between AWS Lambda vs EC2.

<details>
<summary>Answer</summary>

**AWS Lambda**:
✅ Serverless (no management)
✅ Pay per use ($1-5/mo)
✅ Auto-scaling
❌ Cold starts
❌ 15-min timeout
❌ Limited to Node.js versions AWS supports

**EC2**:
✅ Full control
✅ No cold starts
✅ Can run 24/7
❌ Manual scaling
❌ Higher cost ($10+/mo)
❌ Server management overhead

**Choice**: Lambda for this project (low traffic, cron-based)
</details>

---

### Card 58
**Q**: What are the pros/cons of Next.js vs separate React + Express?

<details>
<summary>Answer</summary>

**Next.js (Full-Stack)**:
✅ One codebase (frontend + backend)
✅ File-based routing
✅ Built-in optimizations
✅ Easy deployment (Vercel)
✅ Server components
❌ Vendor lock-in
❌ Learning curve

**React + Express (Separate)**:
✅ Full control
✅ Technology flexibility
✅ Easier microservices
❌ Two codebases
❌ More configuration
❌ Deployment complexity

**Choice**: Next.js for faster development
</details>

---

### Card 59
**Q**: How would you implement A/B testing for tweet reply templates?

<details>
<summary>Answer</summary>

**Implementation**:

```typescript
const variants = {
  A: "URGENT: ${issue} at ${location}. Please fix! ${hashtag}",
  B: "Dear @GBA_office, citizens reporting ${issue} at ${location}. ${hashtag}",
};

// Random assignment
const variant = Math.random() < 0.5 ? 'A' : 'B';
const reply = generateReply(complaint, variants[variant]);

// Track metrics
await trackMetric('twitter_reply_variant', {
  variant,
  tweetId: tweet.id,
  engagement: 0  // Update later from Twitter API
});
```

**Measure**: Engagement rate (likes, retweets, replies)
</details>

---

### Card 60
**Q**: What would you present in a technical interview about this project?

<details>
<summary>Answer</summary>

**Presentation Flow** (15 minutes):

1. **Problem** (2 min): Citizen complaints, lack of tracking
2. **Architecture** (3 min): Draw high-level diagram
3. **Key Challenge** (3 min): Twitter rate limiting solution
4. **Tech Decisions** (2 min): Why Next.js, Prisma, Leaflet
5. **Testing** (2 min): TDD approach, 85% coverage
6. **Production** (2 min): AWS Lambda deployment, monitoring
7. **Demo** (1 min): Live system or screenshots

**Practice**: Explain each section without looking at notes
</details>

---

## Study Tips

### How to Use These Flashcards

1. **First Pass**: Read all cards, don't stress about memorizing
2. **Second Pass**: Cover answers, try to recall
3. **Third Pass**: Focus on cards you got wrong
4. **Daily Review**: 10-15 cards per day
5. **Mock Interview**: Have someone quiz you randomly

### Study Schedule

**Day 1**: Cards 1-15 (Tech Stack & Architecture)
**Day 2**: Cards 16-30 (Database & Twitter Bot)
**Day 3**: Cards 31-45 (Testing & DevOps)
**Day 4**: Cards 46-60 (Advanced & Interview)
**Day 5**: Random review of all 60 cards

### Retention Technique

**Spaced Repetition**:
- Review after 1 day
- Review after 3 days
- Review after 7 days
- Review after 14 days

### Before Interview

Review cards: 1, 6, 8, 15, 25, 29, 39, 51, 52, 60

---

**Total Study Time**: 2-3 hours to master all 60 cards
**Review Time**: 30 minutes per session

Good luck! 🚀
