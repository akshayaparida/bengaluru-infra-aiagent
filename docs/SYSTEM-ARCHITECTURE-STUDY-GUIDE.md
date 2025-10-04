# Bengaluru Infrastructure AI Agent - Complete System Architecture Study Guide

Last Updated: Oct 4, 2025
Purpose: Deep understanding of the entire system for interviews and production deployment

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Design](#4-database-design)
5. [Core Components](#5-core-components)
6. [API Design](#6-api-design)
7. [AI Integration](#7-ai-integration)
8. [Twitter Monitoring System](#8-twitter-monitoring-system)
9. [Rate Limiting Strategy](#9-rate-limiting-strategy)
10. [Testing Strategy](#10-testing-strategy)
11. [DevOps & Deployment](#11-devops--deployment)
12. [Security & Best Practices](#12-security--best-practices)
13. [Interview Topics](#13-interview-topics)
14. [Production Considerations](#14-production-considerations)

---

## 1. Project Overview

### What is This Project?

A citizen-facing infrastructure complaint reporting system for Bengaluru that:
- Allows citizens to report infrastructure issues (potholes, garbage, water leaks, etc.)
- Uses GPS + photo evidence
- AI-powered classification using Cerebras LLaMA
- Automated notification via email (Mailpit for local dev)
- Twitter bot that monitors government handles and auto-replies to complaints
- Dashboard with map visualization using Leaflet
- Transparency panel showing budget allocation and contractor data

### Why This Project Matters

**Problem Solved**:
- Citizens struggle to report infrastructure issues
- Government departments get scattered complaints
- No centralized tracking of issues
- Poor transparency in budget allocation

**Solution**:
- Single platform for reporting
- Automated classification and routing
- AI-powered engagement on social media
- Data-driven transparency

### Key Features

1. **Citizen Reporting**: GPS + photo + description
2. **AI Classification**: Category (pothole, garbage, etc.) + Severity (low/medium/high)
3. **Email Notifications**: AI-crafted emails to relevant departments
4. **Twitter Bot**: Monitors complaints, auto-replies with support
5. **Dashboard**: Map visualization with filters
6. **Transparency**: Budget and contractor data display

---

## 2. Technology Stack

### Frontend

**Next.js 15**
- WHY: React framework with server-side rendering, routing, and API routes
- USE: Entire application framework
- KEY FEATURES: App Router, Server Components, Server Actions

**React 19**
- WHY: Modern UI library with component-based architecture
- USE: All UI components
- KEY FEATURES: Hooks, Functional Components, Context API

**TypeScript (Strict Mode)**
- WHY: Type safety prevents runtime errors
- USE: Entire codebase
- KEY FEATURES: Strict null checks, Type inference, Interfaces

**Leaflet**
- WHY: Lightweight open-source map library
- USE: Dashboard map visualization
- KEY FEATURES: Markers, Popups, Custom layers

**TailwindCSS**
- WHY: Utility-first CSS for rapid UI development
- USE: All styling
- KEY FEATURES: Responsive design, Custom themes

### Backend

**Next.js API Routes**
- WHY: Co-located API endpoints with frontend code
- USE: All backend APIs
- KEY FEATURES: File-based routing, Middleware, Request/Response handling

**Prisma ORM**
- WHY: Type-safe database access with migrations
- USE: All database operations
- KEY FEATURES: Schema-first, Auto-generated types, Migrations

**PostgreSQL 17.5**
- WHY: Robust, production-grade relational database
- USE: Primary data store
- KEY FEATURES: ACID compliance, JSON support, Full-text search

**Zod**
- WHY: TypeScript-first schema validation
- USE: Input validation for all APIs
- KEY FEATURES: Type inference, Error messages, Transform functions

### AI & External Services

**Cerebras LLaMA API**
- WHY: Fast, sponsored hackathon tech for AI inference
- USE: Classification, tweet generation, email crafting
- KEY FEATURES: Low latency, Cost-effective

**Docker MCP Gateway**
- WHY: Abstraction layer for AI tools and integrations
- USE: AI classification, email sending, social posting
- KEY FEATURES: Tool-based API, Simulation mode

**Twitter API v2**
- WHY: Official API for Twitter/X integration
- USE: Monitor mentions, post replies
- KEY FEATURES: Mention timeline, Tweet posting, User lookup

**Nodemailer + Mailpit**
- WHY: Email testing without real SMTP
- USE: Local email development and testing
- KEY FEATURES: SMTP server, Web UI for viewing emails

### Testing

**Vitest**
- WHY: Fast, modern testing framework for Vite/Next.js
- USE: Unit and integration tests
- KEY FEATURES: Fast execution, TypeScript support, Watch mode

**Playwright**
- WHY: End-to-end testing across browsers
- USE: E2E tests for user flows
- KEY FEATURES: Auto-wait, Screenshots, Parallel execution

**MSW (Mock Service Worker)**
- WHY: API mocking at the network level
- USE: Mock external APIs in tests
- KEY FEATURES: Browser and Node support, TypeScript

### DevOps

**Docker + Docker Compose**
- WHY: Consistent local development environment
- USE: Postgres, Mailpit, MCP Gateway
- KEY FEATURES: Service orchestration, Volume management

**pnpm**
- WHY: Faster, disk-efficient package manager
- USE: Dependency management
- KEY FEATURES: Symlinked node_modules, Workspace support

**Git + GitHub**
- WHY: Version control and collaboration
- USE: Code versioning, CI/CD
- KEY FEATURES: Branching, Pull requests, Actions

**Sharp**
- WHY: High-performance image processing
- USE: EXIF rotation, compression, format conversion
- KEY FEATURES: Fast, Auto-rotation based on EXIF

---

## 3. System Architecture

### High-Level Architecture

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

### Request Flow Examples

#### 1. Citizen Reports Infrastructure Issue

```
User (Browser)
    │
    │ 1. Fill form with GPS, photo, description
    │
    ▼
POST /api/reports
    │
    │ 2. Validate with Zod schema
    │ 3. Process image with Sharp (EXIF rotation)
    │ 4. Save photo to .data/uploads/
    │ 5. Create Report row in Postgres
    │
    ▼
Return { id: "clxyz..." }
    │
    │ 6. Frontend redirects to /dashboard
    │
    ▼
Dashboard shows new pin on map
```

#### 2. Automated Twitter Monitoring (Hourly Cron)

```
EventBridge / Cron Job
    │
    │ 1. Triggers every hour
    │
    ▼
POST /api/cron/monitor-twitter
    │
    │ 2. Load rate limit state from .data/rate-limits.json
    │ 3. Check if API calls allowed
    │
    ▼
Twitter API: Fetch mentions for @GBA_office, @ICCCBengaluru
    │
    │ 4. Get recent mentions (last 2 hours)
    │ 5. Filter out already processed tweets
    │
    ▼
Classify Complaints
    │
    │ 6. Extract keywords (pothole, garbage, water, etc.)
    │ 7. Determine category and severity
    │ 8. Extract location from tweet text
    │
    ▼
Generate AI Reply
    │
    │ 9. Craft context-aware reply based on category/severity
    │ 10. Add hashtags (#FixOurRoads, etc.)
    │ 11. Mention @GBA_office @ICCCBengaluru
    │
    ▼
Post Reply (if enabled)
    │
    │ 12. Check rate limits again
    │ 13. Post reply to Twitter
    │ 14. Record in .data/processed-tweets.json
    │
    ▼
Update Rate Limits
    │
    │ 15. Record API call
    │ 16. Update window counts
    │ 17. Save to .data/rate-limits.json
    │
    ▼
Return { success: true, repliesPosted: 2 }
```

#### 3. AI Classification

```
Report Submitted
    │
    ▼
POST /api/reports/:id/classify
    │
    │ 1. Fetch report from DB
    │ 2. Extract description
    │
    ▼
Classify via MCP Gateway
    │
    │ 3. Send description to Cerebras LLaMA
    │ 4. Prompt: "Classify this infrastructure issue..."
    │ 5. Parse AI response
    │
    ▼
Update Report
    │
    │ 6. Save category (pothole, garbage, etc.)
    │ 7. Save severity (low, medium, high)
    │ 8. Update status to TRIAGED
    │
    ▼
Return { category, severity, simulated: false }
```

### Data Flow Diagram

```
┌─────────────┐
│   Citizen   │
└──────┬──────┘
       │ Reports issue
       ▼
┌─────────────────────────────┐
│  Next.js Frontend (React)   │
│  - GPS capture              │
│  - Photo upload             │
│  - Form validation          │
└──────┬──────────────────────┘
       │
       │ HTTP POST
       ▼
┌─────────────────────────────┐
│  API Route Handler          │
│  - Zod validation           │
│  - Image processing (Sharp) │
│  - File storage             │
└──────┬──────────────────────┘
       │
       │ Prisma ORM
       ▼
┌─────────────────────────────┐
│  PostgreSQL Database        │
│  - Report record created    │
└──────┬──────────────────────┘
       │
       │ (Optional async flow)
       ▼
┌─────────────────────────────┐     ┌──────────────────┐
│  AI Classification          │────▶│  Cerebras LLaMA  │
│  - Category extraction      │◀────│  via MCP Gateway │
│  - Severity assessment      │     └──────────────────┘
└──────┬──────────────────────┘
       │
       │ Update DB
       ▼
┌─────────────────────────────┐
│  Notification System        │
│  - Email (Mailpit)          │
│  - Twitter mention          │
└──────┬──────────────────────┘
       │
       │ Display on UI
       ▼
┌─────────────────────────────┐
│  Dashboard                  │
│  - Leaflet map              │
│  - Filters                  │
│  - Transparency panel       │
└─────────────────────────────┘
```

---

## 4. Database Design

### Prisma Schema

```prisma
// Primary table for infrastructure reports
model Report {
  id              String       @id @default(cuid())
  createdAt       DateTime     @default(now())
  description     String
  lat             Float
  lng             Float
  photoPath       String
  status          ReportStatus @default(NEW)
  category        String?
  severity        String?
  
  // Automation fields
  emailedAt       DateTime?
  emailMessageId  String?
  tweetedAt       DateTime?
  tweetId         String?

  @@index([createdAt])
}

enum ReportStatus {
  NEW       // Just submitted
  TRIAGED   // AI classified
  NOTIFIED  // Email/tweet sent
}
```

### Field Explanations

**id**: Unique identifier (CUID format)
- WHY: Collision-resistant, sortable, URL-safe
- EXAMPLE: `clxyz12345abcd`

**createdAt**: Timestamp of report submission
- WHY: Track when issues were reported
- USE: Dashboard sorting, analytics

**description**: User's text description of the issue
- WHY: Context for AI classification
- VALIDATION: Minimum 3 characters

**lat / lng**: GPS coordinates (Float)
- WHY: Exact location for map pins
- VALIDATION: lat between -90 and 90, lng between -180 and 180

**photoPath**: Filename of uploaded photo (relative path)
- WHY: Evidence of the issue
- STORAGE: `.data/uploads/` directory
- FORMAT: `{timestamp}-{random}.jpg`

**status**: Current state of report (enum)
- NEW: Just submitted, no processing
- TRIAGED: AI has classified it
- NOTIFIED: Email/tweet sent to authorities

**category**: AI-classified issue type (optional)
- VALUES: pothole, streetlight, garbage, water-leak, tree, traffic
- WHY: Route to correct department

**severity**: AI-assessed urgency (optional)
- VALUES: low, medium, high
- WHY: Prioritize response

**emailedAt / emailMessageId**: Email notification tracking
- WHY: Avoid duplicate notifications
- USE: Audit trail

**tweetedAt / tweetId**: Twitter posting tracking
- WHY: Track social engagement
- USE: Analytics

### Database Indexes

```sql
-- Index on createdAt for fast descending queries
CREATE INDEX idx_report_createdat ON Report(createdAt DESC);

-- Future indexes for production:
CREATE INDEX idx_report_status ON Report(status);
CREATE INDEX idx_report_category ON Report(category);
CREATE INDEX idx_report_severity ON Report(severity);
CREATE INDEX idx_report_location ON Report USING GIST (lat, lng); -- Geospatial
```

### Data Seeding

**Budget Data** (transparency panel):
```json
{
  "department": "BBMP Roads",
  "totalBudget": 50000000,
  "allocated": 45000000,
  "spent": 38000000,
  "contractor": "ABC Constructions Pvt Ltd"
}
```

Stored in: `data/seed/budgets.json`

---

## 5. Core Components

### 5.1 Report Form Component

**File**: `src/app/report/ReportForm.tsx`

**Responsibilities**:
- Capture user input (description, GPS, photo)
- Client-side validation
- Multipart form submission
- Error handling and user feedback

**Key Technologies**:
- React useState for form state
- Navigator.geolocation API for GPS
- FileReader API for photo preview
- FormData for multipart upload

**Code Flow**:
```typescript
1. User clicks "Get GPS" → Navigator.geolocation.getCurrentPosition()
2. User selects photo → FileReader reads for preview
3. User submits form → FormData with description, lat, lng, photo
4. POST to /api/reports
5. On success → Redirect to /dashboard
6. On error → Display error message
```

### 5.2 Dashboard Component

**File**: `src/app/dashboard/DashboardView.tsx`

**Responsibilities**:
- Fetch reports from API
- Render Leaflet map with markers
- Filter reports by category/severity
- Show transparency data

**Key Technologies**:
- React useEffect for data fetching
- Leaflet for map rendering
- Custom marker popups with report details

**Code Flow**:
```typescript
1. Component mounts → useEffect fetches GET /api/reports
2. Parse response → items[]
3. Initialize Leaflet map centered on Bengaluru
4. For each report → L.marker([lat, lng]).bindPopup(details)
5. User clicks filter → Re-render filtered markers
```

### 5.3 Classification Module

**File**: `src/lib/classify.ts`

**Responsibilities**:
- Classify reports into categories
- Determine severity
- Fallback to simulated classification if AI fails

**Two Modes**:

**1. Simulated (keyword matching)**:
```typescript
function classifySimulated(description: string) {
  if (description.includes('pothole')) return { category: 'pothole', severity: 'medium' };
  if (description.includes('garbage')) return { category: 'garbage', severity: 'low' };
  // ... more rules
}
```

**2. AI-Powered (Cerebras via MCP)**:
```typescript
async function classifyViaMcp(description: string, mcpBaseUrl: string) {
  const response = await fetch(`${mcpBaseUrl}/tools/classify.report`, {
    method: 'POST',
    body: JSON.stringify({ description })
  });
  const { category, severity } = await response.json();
  return { category, severity, simulated: false };
}
```

### 5.4 Twitter Monitor Service

**File**: `src/lib/twitter-monitor.ts`

**Responsibilities**:
- Monitor government Twitter handles for mentions
- Classify infrastructure complaints from tweets
- Generate AI-powered replies
- Post replies (if enabled)

**Key Methods**:

**getUserId(username)**: Resolve @handle to Twitter user ID
```typescript
const user = await client.v2.userByUsername('GBA_office');
return user.data.id;
```

**fetchMentions(userId)**: Get recent mentions
```typescript
const mentions = await client.v2.userMentionTimeline(userId, {
  max_results: 20,
  'tweet.fields': ['created_at', 'author_id']
});
```

**classifyComplaint(tweet)**: Keyword-based classification
```typescript
const keywords = {
  roads: ['pothole', 'road', 'highway'],
  water: ['water', 'leak', 'pipeline'],
  waste: ['garbage', 'trash', 'dump']
};
// Check if tweet text contains keywords
// Return { category, severity, location, keywords }
```

**generateAIReply(complaint)**: Craft empathetic reply
```typescript
const reply = `@GBA_office @ICCCBengaluru ${concernText} Please prioritize this. ${hashtag}`;
// Concern text varies by category and severity
// Example: "URGENT: This pothole in Indiranagar poses serious safety risk!"
```

**postReply(tweetId, replyText)**: Post reply to Twitter
```typescript
await client.v2.reply(replyText, tweetId);
```

### 5.5 Rate Limit Manager

**File**: `src/lib/rate-limit-tracker.ts`

**Responsibilities**:
- Track API usage per endpoint
- Prevent exceeding Twitter API limits
- Persist state across runs

**Data Structure**:
```typescript
interface RateLimitData {
  endpoint: string;
  callsInWindow: number;
  windowStart: number; // Unix timestamp
  lastCall: number;
  resetTime: number; // From Twitter headers
}
```

**Limits** (Twitter Free Tier):
- Mention Timeline: 3 calls per 15 minutes (96 per day)
- Post Tweet: 50 per 15 minutes (1,500 per day)
- User Lookup: 300 per 15 minutes

**Key Methods**:

**canMakeCall(endpoint)**: Check if under limit
```typescript
const now = Date.now();
if (now - windowStart > 15 * 60 * 1000) {
  // Reset window
  callsInWindow = 0;
}
return callsInWindow < limit;
```

**waitIfNeeded(endpoint)**: Smart delay
```typescript
const waitMs = getWaitTime(endpoint);
if (waitMs > 0) {
  console.log(`Waiting ${minutes} minutes...`);
  await sleep(waitMs);
}
```

**recordCall(endpoint)**: Track usage
```typescript
callsInWindow++;
lastCall = Date.now();
save(); // Persist to .data/rate-limits.json
```

---

## 6. API Design

### API Routes Overview

```
/api/reports                    GET, POST
/api/reports/:id/photo          GET
/api/reports/:id/classify       POST
/api/reports/:id/notify         POST
/api/reports/:id/tweet          POST
/api/transparency/budgets       GET
/api/health                     GET
/api/cron/monitor-twitter       POST
```

### 6.1 POST /api/reports

**Purpose**: Create new infrastructure report

**Request**:
```http
POST /api/reports
Content-Type: multipart/form-data

description: "Large pothole on 100ft Road"
lat: 12.9716
lng: 77.5946
photo: [binary image data]
```

**Validation** (Zod):
```typescript
{
  description: string (min 3 chars),
  lat: number (-90 to 90),
  lng: number (-180 to 180),
  photo: File (jpeg/png only)
}
```

**Processing Steps**:
1. Parse multipart form data
2. Validate with Zod schema
3. Check photo type (jpeg/png only)
4. Generate unique filename: `{timestamp}-{random}.jpg`
5. Process image with Sharp:
   - Auto-rotate based on EXIF
   - Convert to JPEG
   - Save to `.data/uploads/`
6. Create Report row in Postgres
7. Return `{ id: "clxyz..." }`

**Response**:
```json
{
  "id": "clxyz12345abcd"
}
```

**Error Responses**:
```json
// 400 Bad Request
{ "error": "invalid_input", "details": { "description": ["too short"] } }
{ "error": "photo_required" }
{ "error": "unsupported_media_type" }

// 500 Internal Server Error
{ "error": "unexpected_error" }
```

### 6.2 GET /api/reports

**Purpose**: List recent reports for dashboard

**Request**:
```http
GET /api/reports?limit=50&q=pothole
```

**Query Parameters**:
- `limit`: Number of reports (default 50, max 100)
- `q`: Search term for description (optional)

**Response**:
```json
{
  "items": [
    {
      "id": "clxyz12345abcd",
      "createdAt": "2025-10-04T10:30:00Z",
      "description": "Large pothole on 100ft Road",
      "lat": 12.9716,
      "lng": 77.5946,
      "status": "NEW",
      "category": "pothole",
      "severity": "high",
      "emailedAt": null,
      "tweetedAt": null
    }
  ]
}
```

### 6.3 POST /api/reports/:id/classify

**Purpose**: AI-classify an existing report

**Request**:
```http
POST /api/reports/clxyz12345abcd/classify
```

**Processing**:
1. Fetch report from DB
2. Send description to MCP Gateway
3. Parse AI response
4. Update report: category, severity, status=TRIAGED

**Response**:
```json
{
  "category": "pothole",
  "severity": "high",
  "simulated": false
}
```

### 6.4 POST /api/reports/:id/notify

**Purpose**: Send email notification to authorities

**Processing**:
1. Fetch report from DB
2. Generate AI-crafted email body
3. Send via Nodemailer (Mailpit SMTP)
4. Update report: emailedAt, emailMessageId

**Response**:
```json
{
  "success": true,
  "messageId": "<abc@mailpit>"
}
```

### 6.5 POST /api/cron/monitor-twitter

**Purpose**: Automated Twitter monitoring (triggered hourly)

**Processing**:
1. Load rate limit state
2. Check if API calls allowed
3. Fetch mentions for monitored handles
4. Filter recent tweets (last 2 hours)
5. Classify infrastructure complaints
6. Generate AI replies
7. Post replies (if enabled)
8. Update rate limits
9. Save processed tweet IDs

**Response**:
```json
{
  "success": true,
  "monitored": ["@GBA_office", "@ICCCBengaluru"],
  "totalTweets": 12,
  "complaints": 5,
  "repliesPosted": 3
}
```

### 6.6 GET /api/health

**Purpose**: Health check for all services

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-04T10:30:00Z",
  "services": {
    "database": "ok",
    "mailpit": "ok",
    "mcp": "ok"
  }
}
```

---

## 7. AI Integration

### Cerebras LLaMA Integration

**What is Cerebras?**
- AI inference platform
- Fast, low-latency LLM responses
- Hackathon sponsor tech

**How We Use It**:
1. Classification of infrastructure issues
2. Email body generation
3. Twitter reply crafting

### MCP Gateway

**What is MCP Gateway?**
- Model Context Protocol
- Abstraction layer for AI tools
- Docker-based service

**Architecture**:
```
Next.js App
    │
    │ HTTP POST
    ▼
MCP Gateway (localhost:8009)
    │
    │ Tool: classify.report
    ▼
Cerebras LLaMA API
    │
    │ Inference
    ▼
Return { category, severity }
```

**Available Tools**:
- `classify.report`: Categorize infrastructure issue
- `email.send`: Generate and send email
- `social.tweet`: Post to Twitter (simulation mode)
- `storage.write`: Save data to disk
- `mentions.fetch`: Get Twitter mentions

**Example Request**:
```typescript
const response = await fetch('http://localhost:8009/tools/classify.report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: "There's a huge pothole on 100ft Road causing accidents"
  })
});

const { category, severity } = await response.json();
// category: "pothole"
// severity: "high"
```

### AI Prompting Strategies

**Classification Prompt**:
```
You are an infrastructure expert analyzing citizen complaints.

Complaint: "{description}"

Classify into one of these categories:
- pothole: Road damage, cracks, potholes
- streetlight: Broken/dark street lights
- garbage: Waste accumulation, dirty streets
- water-leak: Pipeline leaks, water supply issues
- tree: Fallen trees, overgrown branches
- traffic: Traffic signals, congestion

Assess severity as:
- low: Minor inconvenience
- medium: Moderate issue affecting daily life
- high: Urgent safety hazard

Return JSON: { "category": "...", "severity": "..." }
```

**Email Generation Prompt**:
```
Draft a professional email to the BBMP department about this infrastructure issue:

Issue: {description}
Location: ({lat}, {lng})
Category: {category}
Severity: {severity}

The email should:
- Be respectful and formal
- Clearly describe the problem
- Request prompt action
- Include GPS coordinates for easy location

Keep it under 200 words.
```

**Tweet Reply Prompt** (actually templated, not AI-generated):
```typescript
const concernText = {
  roads: {
    high: "URGENT: This road hazard poses serious safety risk!",
    medium: "This road condition is causing daily inconvenience.",
    low: "This road issue needs attention."
  }
}[category][severity];

const reply = `@GBA_office @ICCCBengaluru ${concernText} Please prioritize. #FixOurRoads`;
```

---

## 8. Twitter Monitoring System

### Architecture

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

### Classification Logic

**Infrastructure Keywords**:
```typescript
const INFRASTRUCTURE_KEYWORDS = {
  roads: ['pothole', 'road', 'highway', 'street', 'patch', 'crack', 'damage'],
  water: ['water', 'leak', 'pipeline', 'supply', 'drainage', 'sewage'],
  waste: ['garbage', 'waste', 'trash', 'dustbin', 'litter', 'dump'],
  lighting: ['street light', 'lamp', 'dark', 'lighting', 'bulb'],
  parks: ['park', 'tree', 'garden', 'playground', 'green']
};
```

**Severity Determination**:
```typescript
HIGH: ['urgent', 'emergency', 'danger', 'accident', 'injury', 'critical']
MEDIUM: ['please', 'fix', 'soon', 'days', 'weeks', 'month']
LOW: (default if no priority words found)
```

**Location Extraction** (regex):
```typescript
/(?:at|near|on|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Road|Street|Avenue|Layout|Nagar))/i

Examples:
"pothole on Indiranagar 100ft Road" → "Indiranagar 100ft Road"
"garbage near MG Road" → "MG Road"
```

### Reply Templates

**Category-Specific Concerns**:

**Waste (High Severity)**:
```
This garbage issue in Indiranagar is a serious health hazard affecting our community.
```

**Roads (High Severity)**:
```
URGENT: This road hazard on MG Road poses serious safety risk to commuters and pedestrians!
```

**Water (Medium Severity)**:
```
This water problem in Koramangala is affecting residents and needs quick resolution.
```

**Full Reply Example**:
```
@GBA_office @ICCCBengaluru URGENT: This road hazard on Indiranagar 100ft Road poses serious safety risk! Please prioritize this. #FixOurRoads
```

### Processed Tweets Tracking

**File**: `.data/processed-tweets.json`

**Structure**:
```json
{
  "tweets": [
    {
      "id": "1234567890",
      "processedAt": "2025-10-04T10:30:00Z",
      "repliedAt": "2025-10-04T10:31:00Z",
      "replyId": "0987654321",
      "category": "roads",
      "severity": "high"
    }
  ]
}
```

**Purpose**:
- Avoid processing same tweet multiple times
- Track reply success
- Analytics data

---

## 9. Rate Limiting Strategy

### Why Rate Limiting?

**Twitter API Free Tier Limits**:
- Mention Timeline: 3 calls per 15 min (96 per day)
- Post Tweet: 50 per 15 min (1,500 per day)
- User Lookup: 300 per 15 min

**Without Rate Limiting**:
- Hit limits quickly
- Get temporarily banned
- Lose automation capability

**With Rate Limiting**:
- Stay within limits
- Predictable behavior
- 24/7 operation

### Rate Limit Tracker Design

**State Management**:
```typescript
interface RateLimitData {
  endpoint: string;
  callsInWindow: number;      // Current usage
  windowStart: number;         // When current window started
  lastCall: number;            // Last API call timestamp
  resetTime: number;           // From Twitter's x-rate-limit-reset header
}
```

**Window-Based Tracking**:
```
Window 1 (0:00 - 0:15)     Window 2 (0:15 - 0:30)     Window 3 (0:30 - 0:45)
├───┬───┬───────────┤      ├───┬───┬───────────┤      ├───┬───────────────┤
 1   2   3 (limit)          1   2   3 (limit)          1   2  (under limit)
```

**Algorithm**:
```typescript
function canMakeCall(endpoint) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  // Check if window expired
  if (now - windowStart > windowMs) {
    // Reset window
    callsInWindow = 0;
    windowStart = now;
  }
  
  // Check limit
  return callsInWindow < limit;
}
```

**Smart Waiting**:
```typescript
async function waitIfNeeded(endpoint) {
  const waitMs = getWaitTime(endpoint);
  
  if (waitMs > 0) {
    const minutes = Math.ceil(waitMs / 60000);
    console.log(`⏳ Rate limit reached for ${endpoint}`);
    console.log(`   Waiting ${minutes} minute(s)...`);
    console.log(`   Will resume at: ${new Date(Date.now() + waitMs).toLocaleTimeString()}`);
    
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
}
```

### Rate Limit Header Parsing

**Twitter Response Headers**:
```
x-rate-limit-limit: 3
x-rate-limit-remaining: 1
x-rate-limit-reset: 1696420800
```

**Parsing Logic**:
```typescript
function updateFromHeaders(headers) {
  const resetTime = parseInt(headers['x-rate-limit-reset']) * 1000;
  const remaining = parseInt(headers['x-rate-limit-remaining']);
  const limit = parseInt(headers['x-rate-limit-limit']);
  
  callsInWindow = limit - remaining;
  resetTime = resetTime;
  
  save(); // Persist state
}
```

### Conservative Throttling

**Safety Threshold** (80% of limit):
```typescript
function shouldThrottle(endpoint) {
  const safetyThreshold = limit * 0.8;
  return callsInWindow >= safetyThreshold;
}

// Usage
if (shouldThrottle('mentionTimeline')) {
  console.log('Approaching rate limit, slowing down...');
  await sleep(5000); // 5 second delay
}
```

### Production Storage Options

**Local Development**:
- JSON file: `.data/rate-limits.json`
- Simple, no dependencies

**AWS Lambda**:
- DynamoDB: Key-value store
- Serverless, pay-per-request

**Vercel**:
- Vercel KV: Redis-based
- Built-in integration

**Docker**:
- Redis: In-memory cache
- Fast, persistent

---

## 10. Testing Strategy

### Test Pyramid

```
                    ╱╲
                   ╱  ╲
                  ╱ E2E╲              5% (Playwright)
                 ╱──────╲
                ╱        ╲
               ╱Integration╲          25% (Vitest + MSW)
              ╱────────────╲
             ╱              ╲
            ╱      Unit      ╲       70% (Vitest)
           ╱──────────────────╲
```

### Unit Tests

**Purpose**: Test individual functions in isolation

**Tools**: Vitest

**Examples**:

**1. Classification Logic**:
```typescript
// tests/unit/classify.test.ts
describe('classifySimulated', () => {
  it('should classify pothole from description', () => {
    const result = classifySimulated('Huge pothole on MG Road');
    expect(result.category).toBe('pothole');
    expect(result.severity).toBe('high');
  });
  
  it('should default to traffic if no keywords match', () => {
    const result = classifySimulated('General complaint');
    expect(result.category).toBe('traffic');
  });
});
```

**2. Rate Limiter**:
```typescript
// tests/unit/rate-limiter.test.ts
describe('RateLimitManager', () => {
  it('should allow calls under limit', () => {
    const manager = new RateLimitManager();
    expect(manager.canMakeCall('mentionTimeline')).toBe(true);
  });
  
  it('should block calls at limit', () => {
    const manager = new RateLimitManager();
    manager.recordCall('mentionTimeline');
    manager.recordCall('mentionTimeline');
    manager.recordCall('mentionTimeline');
    expect(manager.canMakeCall('mentionTimeline')).toBe(false);
  });
  
  it('should reset window after 15 minutes', async () => {
    const manager = new RateLimitManager();
    // Simulate 15 minutes passing
    jest.advanceTimersByTime(15 * 60 * 1000);
    expect(manager.canMakeCall('mentionTimeline')).toBe(true);
  });
});
```

**3. Twitter Monitor**:
```typescript
// tests/unit/twitter-monitor.test.ts
describe('TwitterMonitorService', () => {
  it('should classify tweet as roads complaint', () => {
    const monitor = new TwitterMonitorService(/*...*/);
    const tweet = {
      id: '123',
      text: '@GBA_office pothole on 100ft road causing accidents',
      authorId: '456',
      authorUsername: 'citizen1',
      createdAt: new Date().toISOString()
    };
    
    const complaint = monitor.classifyComplaint(tweet);
    expect(complaint?.category).toBe('roads');
    expect(complaint?.severity).toBe('high');
  });
  
  it('should extract location from tweet', () => {
    const text = 'pothole on Indiranagar 100ft Road';
    const location = extractLocation(text);
    expect(location).toBe('Indiranagar 100ft Road');
  });
});
```

### Integration Tests

**Purpose**: Test API endpoints with database

**Tools**: Vitest + MSW (Mock Service Worker)

**Examples**:

**1. POST /api/reports**:
```typescript
// tests/integration/api.reports.post.test.ts
describe('POST /api/reports', () => {
  it('should create report with valid data', async () => {
    const formData = new FormData();
    formData.append('description', 'Pothole on MG Road');
    formData.append('lat', '12.9716');
    formData.append('lng', '77.5946');
    formData.append('photo', new File(['fake'], 'test.jpg', { type: 'image/jpeg' }));
    
    const response = await fetch('/api/reports', {
      method: 'POST',
      body: formData
    });
    
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });
  
  it('should reject invalid coordinates', async () => {
    const formData = new FormData();
    formData.append('description', 'Test');
    formData.append('lat', '999'); // Invalid
    formData.append('lng', '77.5946');
    formData.append('photo', new File(['fake'], 'test.jpg', { type: 'image/jpeg' }));
    
    const response = await fetch('/api/reports', {
      method: 'POST',
      body: formData
    });
    
    expect(response.status).toBe(400);
  });
});
```

**2. Twitter Monitoring with Mocks**:
```typescript
// tests/integration/twitter-monitor.test.ts
describe('Twitter Monitoring', () => {
  beforeEach(() => {
    // Mock Twitter API
    server.use(
      rest.get('https://api.twitter.com/2/users/by/username/:username', (req, res, ctx) => {
        return res(ctx.json({ data: { id: '123' } }));
      }),
      rest.get('https://api.twitter.com/2/users/:id/mentions', (req, res, ctx) => {
        return res(ctx.json({
          data: [
            {
              id: '456',
              text: '@GBA_office pothole on MG Road',
              author_id: '789',
              created_at: new Date().toISOString()
            }
          ],
          includes: {
            users: [{ id: '789', username: 'citizen1' }]
          }
        }));
      })
    );
  });
  
  it('should fetch and classify mentions', async () => {
    const monitor = new TwitterMonitorService(/*...*/);
    const tweets = await monitor.monitorAllHandles();
    
    expect(tweets.length).toBeGreaterThan(0);
    expect(tweets[0].text).toContain('pothole');
  });
});
```

### E2E Tests

**Purpose**: Test full user flows in browser

**Tools**: Playwright

**Examples**:

**1. Submit Report Flow**:
```typescript
// tests/e2e/submit-report.spec.ts
test('citizen can submit infrastructure report', async ({ page }) => {
  // Navigate to report form
  await page.goto('/report');
  
  // Fill form
  await page.fill('textarea[name=description]', 'Large pothole on MG Road');
  
  // Mock GPS
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (success) => {
      success({
        coords: {
          latitude: 12.9716,
          longitude: 77.5946,
          accuracy: 10
        }
      });
    };
  });
  
  await page.click('button:has-text("Get GPS")');
  await page.waitForSelector('text=12.9716');
  
  // Upload photo
  await page.setInputFiles('input[type=file]', './test-fixtures/pothole.jpg');
  
  // Submit
  await page.click('button:has-text("Submit Report")');
  
  // Should redirect to dashboard
  await page.waitForURL('/dashboard');
  
  // Should see new pin on map
  await expect(page.locator('.leaflet-marker')).toBeVisible();
});
```

**2. Dashboard View**:
```typescript
// tests/e2e/dashboard.spec.ts
test('dashboard shows reports on map', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Wait for map to load
  await page.waitForSelector('.leaflet-container');
  
  // Should have markers
  const markers = await page.locator('.leaflet-marker').count();
  expect(markers).toBeGreaterThan(0);
  
  // Click marker
  await page.locator('.leaflet-marker').first().click();
  
  // Should show popup with details
  await expect(page.locator('.leaflet-popup-content')).toBeVisible();
  await expect(page.locator('.leaflet-popup-content')).toContainText('pothole');
});
```

### Test Coverage Goals

```
Component/Module          Target Coverage
────────────────────────  ───────────────
API Routes                95%+
Business Logic (lib/)     90%+
React Components          80%+
Utilities                 95%+
Overall                   85%+
```

### Running Tests

```bash
# All unit + integration tests
pnpm test

# Watch mode
pnpm test --watch

# With UI
pnpm test:ui

# E2E tests
pnpm e2e

# E2E in headed mode (see browser)
pnpm exec playwright test --headed

# Coverage report
pnpm test --coverage
```

---

## 11. DevOps & Deployment

### Local Development Setup

**Prerequisites**:
- Node.js 18+
- pnpm
- Docker Desktop
- PostgreSQL client (optional)

**Quick Start**:
```bash
# 1. Clone repository
git clone <repo-url>
cd bengaluru-infra-aiagent

# 2. Install dependencies
pnpm install

# 3. Copy environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Start infrastructure services
docker compose up -d postgres mailpit mcp

# 5. Run database migrations
pnpm prisma migrate dev

# 6. Seed database (optional)
pnpm prisma db seed

# 7. Start development server
pnpm dev

# Open browser: http://localhost:3000
```

**Verify Services**:
```bash
# Check Docker containers
docker compose ps

# Should see:
# - postgres (5432)
# - mailpit (8025, 1025)
# - mcp (8009)

# Test connections
pnpm exec prisma studio  # Database UI on localhost:5555
open http://localhost:8025  # Mailpit inbox
curl http://localhost:8009/health  # MCP Gateway
```

### Docker Compose Configuration

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:17.5-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-localdev}
      POSTGRES_DB: infra
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  mailpit:
    image: axllent/mailpit:latest
    ports:
      - "8025:8025"  # Web UI
      - "1025:1025"  # SMTP server
    environment:
      MP_SMTP_AUTH_ACCEPT_ANY: 1
      MP_SMTP_AUTH_ALLOW_INSECURE: 1
  
  mcp:
    build: ./mcp-gateway
    ports:
      - "8009:8009"
    environment:
      CEREBRAS_API_KEY: ${CEREBRAS_API_KEY}
      NODE_ENV: development
    volumes:
      - ./mcp-gateway:/app
      - /app/node_modules

volumes:
  postgres-data:
```

### Environment Variables

**File**: `.env.example` (template)

```bash
# Database
DATABASE_URL=postgresql://postgres:localdev@localhost:5432/infra?schema=public

# Email (Mailpit for local dev)
MAILPIT_HOST=localhost
MAILPIT_SMTP_PORT=1025
MAILPIT_UI_URL=http://localhost:8025

# AI (MCP Gateway)
MCP_BASE_URL=http://localhost:8009
CEREBRAS_API_KEY=your_cerebras_api_key_here

# Twitter API
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Feature Flags
ENABLE_EMAIL=true
ENABLE_CLASSIFICATION=true
AUTO_POST_REPLY=false  # Set true for automated replies

# Twitter Monitoring
MONITOR_HANDLES=@GBA_office,@ICCCBengaluru

# File Storage
FILE_STORAGE_DIR=.data/uploads

# Node Environment
NODE_ENV=development
```

### Deployment Options

#### Option 1: AWS Lambda (Recommended)

**Pros**:
- Serverless (no server management)
- Pay-per-use ($1-5/month)
- Auto-scaling
- AWS learning opportunity

**Architecture**:
```
EventBridge (Cron) → Lambda → DynamoDB (Rate Limits)
                      │
                      └→ Twitter API
```

**Key Services**:
- AWS Lambda: Run monitoring code
- EventBridge: Cron trigger
- DynamoDB: Rate limit storage
- Secrets Manager: API keys
- CloudWatch Logs: Monitoring

**Cost Estimate**: $1-5/month

**Setup Time**: 30-45 minutes

**See**: `docs/PRODUCTION-DEPLOYMENT.md` for full Lambda setup

#### Option 2: Vercel (Easiest)

**Pros**:
- One-command deploy
- Built-in cron jobs
- Zero DevOps
- Free tier sufficient

**Architecture**:
```
Vercel Cron → Vercel Function → Vercel KV (Rate Limits)
                │
                └→ Twitter API
```

**Deploy**:
```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add TWITTER_API_KEY
vercel env add TWITTER_API_SECRET
# ... (repeat for all keys)
```

**Cost**: Free (Hobby plan)

**Setup Time**: 5-10 minutes

#### Option 3: AWS EC2 (Traditional)

**Pros**:
- Full control
- Like your laptop
- Free tier (12 months)
- Simple cron setup

**Architecture**:
```
EC2 Instance
  ├── PM2 (Process Manager)
  ├── Next.js App
  ├── Cron Job (Linux)
  └── Local JSON files (Rate Limits)
```

**Setup**:
```bash
# Launch t2.micro instance (free tier)
# SSH into instance
ssh -i key.pem ubuntu@<ec2-ip>

# Install Node.js, pnpm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2

# Clone and setup
git clone <repo-url>
cd bengaluru-infra-aiagent
pnpm install
pnpm build

# Start with PM2
pm2 start pnpm --name bengaluru-twitter -- start
pm2 startup
pm2 save

# Setup cron
crontab -e
# Add: 0 * * * * curl http://localhost:3000/api/cron/monitor-twitter
```

**Cost**: Free (12 months), then $10/month

**Setup Time**: 15-20 minutes

### CI/CD Pipeline

**GitHub Actions** (`.github/workflows/ci.yml`):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:17.5-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: infra_test
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run migrations
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/infra_test
      
      - name: Run tests
        run: pnpm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/infra_test
      
      - name: Build
        run: pnpm build
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Monitoring & Observability

**CloudWatch Alarms** (AWS):
```bash
# Alarm on Lambda errors
aws cloudwatch put-metric-alarm \
  --alarm-name bengaluru-twitter-errors \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --threshold 1 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1
```

**Custom Metrics**:
```typescript
// In code
import { CloudWatch } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatch();

async function publishMetric(name: string, value: number) {
  await cloudwatch.putMetricData({
    Namespace: 'BengaluruInfraBot',
    MetricData: [{
      MetricName: name,
      Value: value,
      Unit: 'Count',
      Timestamp: new Date()
    }]
  });
}

// Usage
await publishMetric('ComplaintsDetected', complaintCount);
await publishMetric('RepliesPosted', replyCount);
```

**Structured Logging** (Pino):
```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label })
  }
});

// Usage
logger.info({ userId: '123', action: 'report_submitted' }, 'New report created');
logger.error({ error: err.message, stack: err.stack }, 'API call failed');
```

---

## 12. Security & Best Practices

### Security Checklist

✅ **Never commit secrets**
- Use `.env.local` (gitignored)
- Use `.env.example` for templates
- Use AWS Secrets Manager in production

✅ **Input validation**
- Zod schemas for all API inputs
- Sanitize file uploads (type, size)
- Validate GPS coordinates

✅ **File upload security**
```typescript
// 1. Check file type
const allowed = ['image/jpeg', 'image/png'];
if (!allowed.includes(photo.type)) {
  throw new Error('Unsupported file type');
}

// 2. Generate safe filename (no user input)
const fileName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.jpg`;

// 3. Store outside public directory
const storageDir = '.data/uploads'; // Not in public/

// 4. Serve via API route (access control)
GET /api/reports/:id/photo
```

✅ **SQL Injection Prevention**
- Use Prisma ORM (parameterized queries)
- Never concatenate SQL strings

✅ **Rate Limiting**
- Protect all public APIs
- Use rate limit middleware
- Track by IP address

✅ **HTTPS Only** (production)
```typescript
// middleware.ts
if (process.env.NODE_ENV === 'production' && !req.secure) {
  return NextResponse.redirect(`https://${req.headers.host}${req.url}`);
}
```

✅ **CORS Configuration**
```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://yourdomain.com' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }
      ]
    }
  ];
}
```

✅ **Error Handling**
```typescript
// Never expose internal errors
try {
  // ... operation
} catch (error) {
  logger.error({ error }, 'Internal error');
  
  // Generic error to user
  return NextResponse.json(
    { error: 'An unexpected error occurred' },
    { status: 500 }
  );
}
```

### Best Practices

**1. Type Safety**
```typescript
// Always use strict TypeScript
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**2. Consistent Code Style**
```bash
# Use ESLint + Prettier
pnpm add -D eslint prettier
pnpm eslint .
```

**3. Git Commit Convention**
```bash
# Follow Conventional Commits
feat: add Twitter monitoring system
fix: resolve EXIF rotation issue
docs: update deployment guide
test: add rate limiter unit tests
chore: update dependencies
```

**4. Database Migrations**
```bash
# Never edit migrations manually
pnpm prisma migrate dev --name add_twitter_fields

# Always review migration SQL
cat prisma/migrations/*/migration.sql
```

**5. Environment-Specific Config**
```typescript
const config = {
  development: {
    rateLimit: { enabled: false },
    autoPost: false
  },
  production: {
    rateLimit: { enabled: true },
    autoPost: true
  }
}[process.env.NODE_ENV];
```

**6. Graceful Degradation**
```typescript
// Always have fallbacks
async function classifyReport(description: string) {
  try {
    return await classifyViaMcp(description, mcpBaseUrl);
  } catch (error) {
    logger.warn('MCP classification failed, using simulated');
    return classifySimulated(description);
  }
}
```

---

## 13. Interview Topics

### System Design Questions

**Q: How would you scale this system to handle 10,000 reports per day?**

A: 
1. **Database**: Add read replicas for GET /api/reports queries
2. **File Storage**: Move to S3/CloudFlare R2 with CDN
3. **Caching**: Redis for dashboard data (TTL: 5 minutes)
4. **Queue System**: Bull/BullMQ for async processing (classification, email)
5. **Load Balancing**: Multiple Next.js instances behind ALB
6. **Database Indexing**: Add indexes on lat/lng for geospatial queries

**Q: How do you ensure data consistency?**

A:
1. **ACID Transactions**: Postgres ensures atomicity
2. **Optimistic Locking**: Prisma `@@version` field
3. **Idempotency**: Check for duplicate reports (same GPS + time window)
4. **Retry Logic**: Exponential backoff for external API calls

**Q: How would you handle Twitter API downtime?**

A:
1. **Circuit Breaker**: Stop calling after N consecutive failures
2. **Graceful Degradation**: Continue accepting reports, queue Twitter posting
3. **Dead Letter Queue**: Failed posts go to DLQ for manual review
4. **Monitoring**: Alert on sustained API errors

### Technical Questions

**Q: Explain the EXIF rotation issue and how you fixed it.**

A: Mobile cameras often save photos with EXIF orientation metadata instead of actually rotating pixels. Without handling this, photos appear sideways. Solution: Use Sharp library's `.rotate()` method which reads EXIF orientation tag and physically rotates pixels.

```typescript
await sharp(buffer)
  .rotate() // Auto-rotates based on EXIF Orientation
  .jpeg({ quality: 90 })
  .toFile(outputPath);
```

**Q: Why Prisma over raw SQL?**

A:
- **Type Safety**: Auto-generated types match schema
- **Migrations**: Version-controlled schema changes
- **Developer Experience**: Autocomplete, IntelliSense
- **SQL Injection**: Parameterized queries by default
- **Maintainability**: Easier refactoring

**Q: How does rate limiting work?**

A: Window-based tracking:
1. Store state: `{ callsInWindow: 2, windowStart: 1696420000 }`
2. Check if window expired (15 minutes)
3. If expired, reset counter
4. If under limit, allow call
5. Record call and update counter
6. Persist to disk (JSON file locally, DynamoDB in prod)

**Q: Why Next.js over Express?**

A:
- **Full Stack**: Frontend + Backend in one codebase
- **File-Based Routing**: Intuitive API structure
- **Server Components**: Reduce client-side JavaScript
- **Built-in Optimization**: Image optimization, code splitting
- **Easy Deployment**: Vercel one-click deploy

### Architecture Questions

**Q: Draw the architecture of Twitter monitoring system.**

A: [Draw diagram from section 8]

**Q: What databases would you use for each use case?**

A:
- **Reports**: PostgreSQL (relational, geospatial support)
- **Rate Limits**: Redis (fast, ephemeral)
- **User Sessions**: Redis with TTL
- **Analytics**: ClickHouse (columnar, fast aggregations)
- **File Metadata**: PostgreSQL
- **Search**: Elasticsearch (full-text search)

**Q: How would you implement geospatial search (find reports within 5km)?**

A: PostGIS extension:
```sql
CREATE EXTENSION postgis;

-- Add geography column
ALTER TABLE "Report" 
ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- Update location from lat/lng
UPDATE "Report" 
SET location = ST_SetSRID(ST_MakePoint(lng, lat), 4326);

-- Find reports within 5km of point
SELECT * FROM "Report"
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(77.5946, 12.9716), 4326),
  5000 -- meters
);
```

---

## 14. Production Considerations

### What We Did (POC)

✅ Local development only
✅ JSON files for state
✅ Mailpit for email testing
✅ Simulated Twitter posting
✅ Basic error handling
✅ Manual testing

### What Production Needs

#### Infrastructure

**Database**:
- [ ] Managed Postgres (AWS RDS, Azure Database)
- [ ] Automated backups (daily)
- [ ] Read replicas for scaling
- [ ] Connection pooling (PgBouncer)

**File Storage**:
- [ ] S3 / CloudFlare R2
- [ ] CDN for image delivery
- [ ] Lifecycle policies (archive old photos)
- [ ] Image resizing on-the-fly

**Caching**:
- [ ] Redis / ElastiCache
- [ ] Dashboard data cache (5 min TTL)
- [ ] Budget data cache (1 hour TTL)
- [ ] API response caching

#### Reliability

**Error Handling**:
- [ ] Sentry for error tracking
- [ ] Structured logging (JSON)
- [ ] Error rate alerts
- [ ] Automatic retries with backoff

**Monitoring**:
- [ ] APM (New Relic, Datadog)
- [ ] Custom dashboards
- [ ] Health checks every minute
- [ ] Uptime monitoring (Pingdom)

**Alerting**:
- [ ] PagerDuty integration
- [ ] Slack notifications
- [ ] Email alerts for critical errors
- [ ] SMS for high-severity issues

#### Security

**Authentication**:
- [ ] Admin dashboard with auth
- [ ] OAuth for staff login
- [ ] Role-based access control (RBAC)

**API Security**:
- [ ] API key authentication
- [ ] Rate limiting (per IP/user)
- [ ] DDoS protection (Cloudflare)
- [ ] CSRF tokens

**Compliance**:
- [ ] GDPR compliance (data retention)
- [ ] Privacy policy
- [ ] Terms of service
- [ ] Cookie consent

#### Performance

**Optimization**:
- [ ] Database query optimization
- [ ] Lazy loading of images
- [ ] Service Worker for offline support
- [ ] Code splitting

**Scaling**:
- [ ] Horizontal scaling (multiple instances)
- [ ] Auto-scaling based on load
- [ ] Queue system (Bull, SQS)
- [ ] Async job processing

#### DevOps

**CI/CD**:
- [ ] Automated tests on PR
- [ ] Staging environment
- [ ] Blue-green deployments
- [ ] Rollback capability

**Infrastructure as Code**:
- [ ] Terraform for AWS resources
- [ ] Ansible for server configuration
- [ ] Docker for containerization
- [ ] Kubernetes for orchestration (if scaling big)

**Backup & Recovery**:
- [ ] Automated DB backups
- [ ] Disaster recovery plan
- [ ] Regular restore tests
- [ ] Off-site backup storage

#### Analytics

**Metrics**:
- [ ] Reports per day/week/month
- [ ] Category distribution
- [ ] Response time tracking
- [ ] User engagement metrics

**Dashboards**:
- [ ] Admin analytics dashboard
- [ ] Real-time monitoring
- [ ] Historical trends
- [ ] Geographic heat maps

#### User Experience

**Features**:
- [ ] Email notifications to citizens
- [ ] SMS updates on report status
- [ ] Multi-language support
- [ ] Mobile app (React Native)

**Accessibility**:
- [ ] WCAG 2.1 AA compliance
- [ ] Screen reader support
- [ ] Keyboard navigation
- [ ] High contrast mode

---

## Summary

This system is a full-stack infrastructure reporting platform that combines:

1. **Citizen Reporting**: GPS + photo evidence
2. **AI Classification**: Cerebras LLaMA for categorization
3. **Twitter Monitoring**: Automated social engagement
4. **Dashboard**: Map visualization with transparency
5. **Rate Limiting**: Stay within API limits
6. **Testing**: TDD approach with 85%+ coverage
7. **DevOps**: Docker, CI/CD, multiple deployment options

**Key Technologies**:
- Next.js 15 + React 19 + TypeScript
- PostgreSQL + Prisma ORM
- Cerebras LLaMA + MCP Gateway
- Twitter API v2
- Leaflet for maps
- Vitest + Playwright for testing

**Production-Ready Deployment**:
- AWS Lambda (recommended)
- Vercel (easiest)
- AWS EC2 (traditional)

**Cost**: $1-5/month for Lambda, Free for Vercel

This system demonstrates modern full-stack development, AI integration, social media automation, and production-grade DevOps practices suitable for product-based company interviews.

---

## Next Steps for Learning

1. **Practice Explaining Architecture**: Draw diagrams from memory
2. **Deep Dive Topics**: Pick 3-4 areas to master (e.g., rate limiting, AWS Lambda, React)
3. **Mock Interviews**: Explain design decisions to someone
4. **Build Portfolio**: Deploy to production and showcase
5. **Document Learnings**: Write blog posts about challenges faced

Good luck! 🚀
