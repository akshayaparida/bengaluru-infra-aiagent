# Architecture Diagrams - Practice Templates

Draw these from memory for interview prep.

---

## Diagram 1: High-Level System Architecture

**Time to draw**: 2 minutes

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACES                           │
├─────────────────────────────────────────────────────────────────┤
│  1. Report Form       2. Dashboard       3. Twitter              │
│     (GPS + Photo)        (Map View)         (Auto-replies)       │
└──────────────┬───────────────┬──────────────────┬───────────────┘
               │               │                  │
               ▼               ▼                  ▼
┌──────────────────────────────────────────────────────────────────┐
│                       NEXT.JS API LAYER                           │
├──────────────────────────────────────────────────────────────────┤
│  POST /api/reports              GET /api/reports                 │
│  POST /api/reports/:id/classify GET /api/transparency/budgets    │
│  POST /api/reports/:id/notify   GET /api/health                  │
│  POST /api/reports/:id/tweet    POST /api/cron/monitor-twitter   │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                          │
├──────────────────────────────────────────────────────────────────┤
│  Classification      Twitter Monitor     Rate Limiter            │
│  Email Generation    Report Processing   Health Checks           │
└──────────────┬────────────────┬──────────────────┬───────────────┘
               │                │                  │
               ▼                ▼                  ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   POSTGRES DB    │  │   FILE STORAGE   │  │  EXTERNAL APIs   │
│                  │  │                  │  │                  │
│  Reports         │  │  Photo uploads   │  │  Twitter API     │
│  Budget data     │  │  (.data/uploads) │  │  Cerebras API    │
│  Contractor info │  │  Rate limits     │  │  MCP Gateway     │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Key Points to Mention**:
- 3-tier architecture: Frontend → API → Database
- Business logic layer handles classification, monitoring, rate limiting
- External APIs for AI and Twitter integration
- File storage separate from database

---

## Diagram 2: Twitter Monitoring Flow

**Time to draw**: 3 minutes

```
┌──────────────────────────────────────────────────────────────┐
│  CRON JOB (Hourly)                                            │
│  - Linux cron (local)                                         │
│  - EventBridge (AWS Lambda)                                   │
│  - Vercel Cron (Vercel deployment)                            │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  POST /api/cron/monitor-twitter                               │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Rate Limit Check                                             │
│  - Load .data/rate-limits.json                                │
│  - Check if API calls allowed                                 │
│  - Wait if rate limit exceeded                                │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Fetch Twitter Mentions                                       │
│  - getUserId('@GBA_office')                                   │
│  - getUserId('@ICCCBengaluru')                                │
│  - fetchMentions(userId, maxResults=20)                       │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Filter Recent & Unprocessed                                  │
│  - Keep tweets from last 2 hours only                         │
│  - Check .data/processed-tweets.json                          │
│  - Remove duplicates                                          │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Classify Complaints                                          │
│  - Keyword matching against INFRASTRUCTURE_KEYWORDS           │
│  - Extract category (roads, water, waste, etc.)               │
│  - Determine severity (high, medium, low)                     │
│  - Extract location from text                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Generate AI Replies                                          │
│  - Context-aware concern statements                           │
│  - Mention @GBA_office @ICCCBengaluru                         │
│  - Add category hashtags (#FixOurRoads, etc.)                │
│  - Fit in 280 character limit                                 │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Post Replies (if AUTO_POST_REPLY=true)                      │
│  - Rate limit check again                                     │
│  - client.v2.reply(replyText, tweetId)                        │
│  - Record success/failure                                     │
└────────────────────┬─────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  Update State                                                 │
│  - Record API calls in rate limit tracker                     │
│  - Add processed tweet IDs to .data/processed-tweets.json     │
│  - Log summary                                                │
└──────────────────────────────────────────────────────────────┘
```

**Key Points to Mention**:
- Hourly cron trigger
- Rate limiting before and after API calls
- 2-hour time window to avoid old tweets
- Duplicate prevention with processed tweets tracking
- Conditional posting based on feature flag

---

## Diagram 3: Rate Limiting Window

**Time to draw**: 1 minute

```
Window 1 (0:00 - 0:15)     Window 2 (0:15 - 0:30)     Window 3 (0:30 - 0:45)
├───┬───┬───────────┤      ├───┬───┬───────────┤      ├───┬───────────────┤
 1   2   3 (limit)          1   2   3 (limit)          1   2  (under limit)
                             
                             Reset window at 0:15
                             callsInWindow = 0
```

**Algorithm**:
```
1. Check: now - windowStart > 15 minutes?
2. If yes → Reset: callsInWindow = 0, windowStart = now
3. If callsInWindow < limit → Allow call
4. Else → Calculate wait time = windowEnd - now
5. Record call: callsInWindow++
```

**Key Points to Mention**:
- 15-minute rolling windows
- Twitter limit: 3 calls per 15 min for mention timeline
- State persisted to disk (local) or DynamoDB (prod)
- Automatic waiting when limit hit

---

## Diagram 4: Report Submission Flow

**Time to draw**: 2 minutes

```
User (Browser)
    │
    │ 1. Fill form: GPS + Photo + Description
    │
    ▼
POST /api/reports
    │
    │ 2. Validate with Zod
    │    - description: min 3 chars
    │    - lat: -90 to 90
    │    - lng: -180 to 180
    │    - photo: jpeg/png only
    │
    ▼
Process Image
    │
    │ 3. Sharp.rotate() - Fix EXIF orientation
    │ 4. Convert to JPEG (quality 90)
    │ 5. Generate safe filename
    │ 6. Save to .data/uploads/
    │
    ▼
Create DB Record
    │
    │ 7. Prisma.report.create({
    │      description, lat, lng, photoPath
    │      status: NEW
    │    })
    │
    ▼
Return { id: "clxyz..." }
    │
    │ 8. Frontend redirects to /dashboard
    │
    ▼
Dashboard shows new pin on map
```

**Key Points to Mention**:
- Multipart form data handling
- Zod validation before processing
- EXIF rotation fix with Sharp
- Safe filename generation (no user input)
- Atomic transaction (rollback if any step fails)

---

## Diagram 5: AI Classification Flow

**Time to draw**: 2 minutes

```
Report Submitted
    │
    ▼
POST /api/reports/:id/classify
    │
    │ 1. Fetch report from Postgres
    │
    ▼
Try: AI Classification
    │
    │ 2. POST to MCP Gateway
    │    http://localhost:8009/tools/classify.report
    │    { description: "..." }
    │
    ▼
MCP → Cerebras LLaMA
    │
    │ 3. AI analyzes description
    │    "There's a huge pothole on 100ft Road"
    │
    ▼
Return Classification
    │
    │ 4. { category: "pothole", severity: "high" }
    │
    ▼
Catch: Fallback (if AI fails)
    │
    │ 5. classifySimulated(description)
    │    - Keyword matching
    │    - "pothole" → category: pothole
    │    - "huge" → severity: high
    │
    ▼
Update Database
    │
    │ 6. Prisma.report.update({
    │      category, severity, status: TRIAGED
    │    })
    │
    ▼
Return { category, severity, simulated }
```

**Key Points to Mention**:
- Graceful degradation: AI → Keyword fallback
- MCP Gateway as abstraction layer
- Status progression: NEW → TRIAGED
- Simulated flag indicates fallback used

---

## Diagram 6: Testing Pyramid

**Time to draw**: 1 minute

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲              5% (Playwright)
                 ╱──────╲             - Full browser flows
                ╱        ╲            - Submit report → Dashboard
               ╱Integration╲          
              ╱────────────╲         25% (Vitest + MSW)
             ╱              ╲        - API + DB tests
            ╱      Unit      ╲       - Mock external APIs
           ╱──────────────────╲
                                      70% (Vitest)
                                      - Pure functions
                                      - Classification logic
                                      - Rate limiter
```

**Coverage Targets**:
- API Routes: 95%+
- Business Logic: 90%+
- Components: 80%+
- **Overall: 85%+**

**Key Points to Mention**:
- Unit tests fastest, most numerous
- Integration tests for API + DB interaction
- E2E tests for critical user flows
- MSW for mocking Twitter/AI APIs

---

## Diagram 7: AWS Lambda Deployment

**Time to draw**: 2 minutes

```
┌─────────────────────────────────────────────────────────────────┐
│  AWS CLOUD                                                       │
│                                                                  │
│  ┌──────────────────┐        ┌────────────────┐                │
│  │  EventBridge     │───────▶│   Lambda       │                │
│  │  (Cron: hourly)  │        │   Function     │                │
│  └──────────────────┘        └───────┬────────┘                │
│                                       │                          │
│                               ┌───────▼────────┐                │
│                               │ Secrets Mgr    │                │
│                               │ (API Keys)     │                │
│                               └───────┬────────┘                │
│                                       │                          │
│                               ┌───────▼────────┐                │
│                               │ Rate Limiter   │                │
│                               │ (DynamoDB)     │                │
│                               └───────┬────────┘                │
│                                       │                          │
│                               ┌───────▼────────┐                │
│                               │ Twitter API    │                │
│                               └────────────────┘                │
│                                                                  │
│  Monitoring:                                                     │
│  └──▶ CloudWatch Logs  (all console.log output)                │
│  └──▶ CloudWatch Metrics (custom metrics)                       │
│  └──▶ CloudWatch Alarms (alert on errors)                       │
└─────────────────────────────────────────────────────────────────┘
```

**Cost**: $1-5/month

**Key Components**:
1. **EventBridge**: Cron scheduler (hourly trigger)
2. **Lambda**: Runs monitoring code serverlessly
3. **Secrets Manager**: Stores Twitter API keys securely
4. **DynamoDB**: Replaces local JSON for rate limits
5. **CloudWatch**: Logs, metrics, alarms

**Key Points to Mention**:
- Serverless = no server management
- Pay per execution (not per hour)
- Auto-scales automatically
- Cold start: ~1-2 seconds first run

---

## Diagram 8: Database Schema (Entity Relationship)

**Time to draw**: 2 minutes

```
┌─────────────────────────────────────────────────┐
│                  Report                         │
├─────────────────────────────────────────────────┤
│ id              String (PK) @default(cuid())    │
│ createdAt       DateTime @default(now())        │
│ description     String                          │
│ lat             Float                           │
│ lng             Float                           │
│ photoPath       String                          │
│ status          ReportStatus @default(NEW)      │
│ category        String?                         │
│ severity        String?                         │
│ emailedAt       DateTime?                       │
│ emailMessageId  String?                         │
│ tweetedAt       DateTime?                       │
│ tweetId         String?                         │
│                                                 │
│ @@index([createdAt])                            │
└─────────────────────────────────────────────────┘
        │
        │ Has Status
        ▼
┌──────────────┐
│ ReportStatus │
├──────────────┤
│ NEW          │
│ TRIAGED      │
│ NOTIFIED     │
└──────────────┘
```

**Relationships**:
- Report.status → ReportStatus (enum)
- Report.photoPath → File in `.data/uploads/`

**Indexes**:
- `@@index([createdAt])` - Fast sorting for dashboard

**Key Points to Mention**:
- CUID for globally unique IDs
- Optional fields (?) for AI classification
- Audit trail fields (emailedAt, tweetedAt)
- Status enum tracks workflow progression

---

## Diagram 9: Request/Response Flow

**Time to draw**: 3 minutes

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ HTTP POST /api/reports
                       │ Content-Type: multipart/form-data
                       │ Body: { description, lat, lng, photo }
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              NEXT.JS API ROUTE HANDLER                       │
│                                                              │
│  1. Parse FormData                                           │
│  2. Validate with Zod schema                                 │
│  3. Check photo type (jpeg/png)                              │
│  4. Process image with Sharp                                 │
│  5. Save to .data/uploads/                                   │
│  6. Create Prisma record                                     │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Success
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    RESPONSE                                  │
│                                                              │
│  Status: 201 Created                                         │
│  Body: { id: "clxyz12345abcd" }                             │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Frontend receives response
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT SIDE REDIRECT                            │
│                                                              │
│  window.location.href = '/dashboard'                         │
│                                                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    DASHBOARD PAGE                            │
│                                                              │
│  1. Fetch GET /api/reports                                   │
│  2. Render Leaflet map                                       │
│  3. Add marker for new report                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Error Handling**:
```
400 Bad Request → Invalid input (Zod validation failed)
400 photo_required → No photo provided
400 unsupported_media_type → Not jpeg/png
500 unexpected_error → Internal server error
```

---

## Practice Guide

### How to Use These Diagrams

**Week 1**: Draw each diagram 3 times while looking at template
**Week 2**: Draw from memory, check against template
**Week 3**: Explain while drawing (practice interview)

### Interview Simulation

1. **Setup**: Whiteboard or paper
2. **Timer**: Set 2-3 minutes per diagram
3. **Talk**: Explain as you draw
4. **Key Points**: Mention the listed key points

### Common Interview Questions That Use These Diagrams

1. "Draw the architecture of your system"
   → Use Diagram 1

2. "How does your Twitter bot work?"
   → Use Diagram 2

3. "Explain your rate limiting implementation"
   → Use Diagram 3

4. "Walk me through a report submission"
   → Use Diagram 4

5. "How do you handle AI failures?"
   → Use Diagram 5

6. "What's your testing strategy?"
   → Use Diagram 6

7. "How would you deploy this?"
   → Use Diagram 7

8. "Show me your database schema"
   → Use Diagram 8

---

## Tips for Whiteboard Drawing

1. **Start Big**: Leave room for additions
2. **Use Boxes**: Clear boundaries for components
3. **Arrows**: Show data flow direction
4. **Labels**: Name everything clearly
5. **Legend**: Explain symbols if needed
6. **Talk**: Narrate as you draw
7. **Check**: Glance back to ensure completeness
8. **Clean**: Erase mistakes quickly

## What Interviewers Look For

✅ **Clarity**: Can they understand your diagram?
✅ **Completeness**: Did you miss major components?
✅ **Communication**: Can you explain while drawing?
✅ **Trade-offs**: Do you mention pros/cons?
✅ **Depth**: Can you zoom into details when asked?
✅ **Practicality**: Does your solution work in reality?

---

**Practice Goal**: Draw all 9 diagrams from memory in under 20 minutes total.
