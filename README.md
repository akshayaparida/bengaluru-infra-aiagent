# Bengaluru Infrastructure AI Agent

<div align="center">

**AI-powered citizen reporting platform for infrastructure issues**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![Cerebras](https://img.shields.io/badge/Cerebras-LLaMA-green)](https://cerebras.ai/)
[![Docker](https://img.shields.io/badge/Docker-MCP_Gateway-blue)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.5-blue)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Documentation](./docs/) • [Report Bug](https://github.com/akshayaparida/bengaluru-infra-aiagent/issues) • [Request Feature](https://github.com/akshayaparida/bengaluru-infra-aiagent/issues)

</div>

---

## Overview

A production-ready, full-stack platform enabling Bengaluru citizens to report infrastructure issues (potholes, garbage, water leaks, broken streetlights) with GPS + photo evidence. The system uses AI classification via **Cerebras LLaMA**, automated email notifications to authorities, and an intelligent Twitter bot for civic engagement.

### Key Features

- **AI Classification** – Cerebras LLaMA automatically categorizes issues by type and severity
- **Twitter Integration** – Monitors @GBA_office, @ICCCBengaluru and posts public reports
- **Real-time Dashboard** – Interactive Leaflet map showing all reports with status
- **Smart Notifications** – AI-generated professional emails to civic authorities
- **Rate Limiting** – Intelligent window-based algorithm respecting API limits
- **Cost Control** – Daily AI usage limits with keyword fallback
- **PWA Support** – Installable as mobile app with offline capabilities
- **Comprehensive Tests** – Integration tests with Vitest

### Built For

🏆 **FutureStack GenAI Hackathon by WeMakeDevs** – October 2025

Powered by **Cerebras LLaMA** and **Docker MCP Gateway**

---

## Architecture & System Design

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BENGALURU INFRA AI AGENT                        │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   CITIZEN USER   │         │  CIVIC AUTHORITY │         │   TWITTER    │
│   (Web/Mobile)   │         │     (Email)      │         │   (@GBA)     │
└────────┬─────────┘         └────────▲─────────┘         └──────▲───────┘
         │                            │                            │
         │ 1. Submit Report           │ 3. Notify                  │ 4. Monitor
         │ (GPS + Photo)              │    (AI Email)              │    & Post
         │                            │                            │
         ▼                            │                            │
┌─────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS 15 APP ROUTER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │   Report     │  │  Dashboard   │  │  API Routes  │  │  Cron Bot   ││
│  │   Form UI    │  │  (Leaflet)   │  │  /api/*      │  │  /api/cron  ││
│  └──────┬───────┘  └──────▲───────┘  └──────┬───────┘  └──────┬──────┘│
└─────────┼──────────────────┼─────────────────┼─────────────────┼───────┘
          │                  │                 │                 │
          │                  │                 │                 │
          ▼                  │                 ▼                 │
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND SERVICES LAYER                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │  2. AI Classification (Cerebras LLaMA 3.3-70B)                    │ │
│  │                                                                    │ │
│  │     Next.js → Custom MCP Gateway → Cerebras Cloud API             │ │
│  │       :3000     (HTTP :8008)         (HTTPS)                      │ │
│  │                                                                    │ │
│  │     Output:                                                        │ │
│  │     - Category: pothole/garbage/water_leak/streetlight            │ │
│  │     - Severity: low/medium/high/critical                          │ │
│  │     - AI-generated diagnosis & email content                      │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │   Prisma     │  │   Nodemailer │  │  Twitter API │  │ Rate Limiter││
│  │     ORM      │  │     SMTP     │  │      v2      │  │  (In-Memory)││
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘│
└─────────┼──────────────────┼─────────────────┼─────────────────┼───────┘
          │                  │                 │                 │
          ▼                  ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       DATA & EXTERNAL SERVICES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│
│  │  PostgreSQL  │  │  Custom MCP  │  │  Cerebras AI │  │  Cloudflare ││
│  │   17.5 DB    │  │   Gateway    │  │   Cloud API  │  │     CDN     ││
│  │   (Docker)   │  │  (Docker)    │  │  (LLaMA 3.3) │  │  (Uploads)  ││
│  │   :5432      │  │  :8008       │  │   (HTTPS)    │  │             ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### User Journey & UI Workflow

```
                        CITIZEN REPORTING WORKFLOW

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: DISCOVER ISSUE                                                  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Citizen sees pothole on street → Opens app on phone                │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: REPORT SUBMISSION (Landing Page - /)                            │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [GPS Auto-detect] → 12.9716°N, 77.5946°E (Bengaluru)              │ │
│ │ [Capture Photo] → image.jpg (with EXIF GPS data)                   │ │
│ │ [Description] → "Large pothole near HSR Layout main road"          │ │
│ │                                                                     │ │
│ │ [Submit Report Button] → POST /api/reports                         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: AI PROCESSING (Backend - Automatic)                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ ① Save to PostgreSQL (status: pending)                             │ │
│ │ ② Extract GPS from photo EXIF → coordinates                        │ │
│ │ ③ Check AI rate limits (50/day, window-based)                      │ │
│ │ ④ Send to Cerebras LLaMA via MCP Gateway:                          │ │
│ │    Input: photo + description + location                           │ │
│ │    Output: {                                                        │ │
│ │      category: "pothole",                                          │ │
│ │      severity: "high",                                             │ │
│ │      diagnosis: "Deep pothole 40cm diameter...",                   │ │
│ │      email_subject: "URGENT: Pothole HSR Layout",                  │ │
│ │      email_body: "Professional formatted email..."                 │ │
│ │    }                                                                │ │
│ │ ⑤ Update DB with AI results                                        │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: NOTIFICATION (User Action - /report/[id])                       │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ User sees report details with AI classification:                   │ │
│ │                                                                     │ │
│ │  Category: 🚧 Pothole | Severity: 🔴 High                          │ │
│ │  AI Diagnosis: "Deep pothole 40cm diameter causing traffic..."     │ │
│ │                                                                     │ │
│ │  [Send Email to Authority] → POST /api/reports/:id/notify         │ │
│ │  [Post to Twitter] → POST /api/reports/:id/tweet                  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: MULTI-CHANNEL ALERT                                             │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Email → civic-authority@bbmp.gov.in                                │ │
│ │   Subject: URGENT: High Severity Pothole - HSR Layout              │ │
│ │   Body: AI-generated professional email with map link              │ │
│ │                                                                     │ │
│ │ Twitter → @BBMPofficial (via bot)                                  │ │
│ │   Tweet: "🚨 Pothole Alert! HSR Layout Main Road. Severity: High.  │ │
│ │           View on map: [link] #BengaluruRoads #FixOurRoads"       │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: DASHBOARD TRACKING (/dashboard)                                 │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Interactive Leaflet Map (OpenStreetMap)                            │ │
│ │                                                                     │ │
│ │  📍 Red Markers = Critical/High severity                           │ │
│ │  📍 Yellow Markers = Medium severity                               │ │
│ │  📍 Blue Markers = Low severity                                    │ │
│ │                                                                     │ │
│ │ Click marker → Popup with:                                         │ │
│ │   - Category & Severity                                            │ │
│ │   - Photo thumbnail                                                │ │
│ │   - Status (pending/in_progress/resolved)                          │ │
│ │   - Twitter badge if posted                                        │ │
│ │   - [View Details] → /report/:id                                   │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 7: TWITTER BOT MONITORING (Background - Cron /api/cron)            │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Every 15 minutes:                                                   │ │
│ │  ① Monitor @GBA_office, @ICCCBengaluru mentions                    │ │
│ │  ② Extract location keywords from tweets                           │ │
│ │  ③ Reply with relevant reports from our database                   │ │
│ │  ④ Respect Twitter rate limits (50 reads/15min)                    │ │
│ │                                                                     │ │
│ │ Example:                                                            │ │
│ │   Tweet: "@GBA_office Please fix road near Koramangala"           │ │
│ │   Bot Reply: "We found 3 reports near Koramangala: [map link]"    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Custom MCP Gateway Architecture (Detailed)

```
┌─────────────────────────────────────────────────────────────────────────┐
│            CUSTOM MCP GATEWAY - AI MIDDLEWARE ARCHITECTURE            │
└─────────────────────────────────────────────────────────────────────────┘

┌───────────────────────┐          ┌───────────────────────┐
│   NEXT.JS :3000      │          │   CEREBRAS CLOUD     │
│   (Frontend/API)     │          │   (AI Provider)      │
└───────────┬───────────┘          └──────────┬────────────┘
            │                                 ▲
            │ HTTP POST                       │ HTTPS POST
            │ /tools/classify.report          │ /v1/chat/completions
            │ {description}                   │ {model, messages}
            │                                 │
            ▼                                 │
┌───────────────────────────────────────────────────────────────────────┐
│                                                                       │
│    CUSTOM MCP GATEWAY (Docker Container "bia-mcp" on :8008)          │
│    File: mcp-gateway/server.js (316 lines, Pure Node.js)             │
│                                                                       │
│    ┌─────────────────────────────────────────────────────────────┐    │
│    │  ENDPOINT 1: POST /tools/classify.report                    │    │
│    │  Purpose: AI-powered issue classification                   │    │
│    │                                                                │    │
│    │  Step 1: Receive Request                                    │    │
│    │    Input: {description: "Large pothole on main road"}       │    │
│    │                                                                │    │
│    │  Step 2: Prompt Engineering                                 │    │
│    │    const prompt = `                                           │    │
│    │      You are an AI assistant for civic infrastructure.       │    │
│    │      Classify this issue: "${description}"                    │    │
│    │      Categories: pothole, streetlight, garbage, water-leak    │    │
│    │      Severity: low, medium, high, critical                    │    │
│    │      Respond ONLY with JSON: {category, severity, diagnosis}  │    │
│    │    `;                                                           │    │
│    │                                                                │    │
│    │  Step 3: Call Cerebras API                                  │    │
│    │    https.request({                                            │    │
│    │      hostname: 'api.cerebras.ai',                             │    │
│    │      path: '/v1/chat/completions',                            │    │
│    │      method: 'POST',                                          │    │
│    │      headers: {                                               │    │
│    │        'Authorization': `Bearer ${CEREBRAS_API_KEY}`,         │    │
│    │        'Content-Type': 'application/json'                     │    │
│    │      },                                                       │    │
│    │      body: {                                                  │    │
│    │        model: 'llama3.3-70b',                                 │    │
│    │        messages: [{ role: 'user', content: prompt }]          │    │
│    │      }                                                        │    │
│    │    })                                                         │    │
│    │                                                                │    │
│    │  Step 4: Parse AI Response                                  │    │
│    │    - Extract JSON from response                              │    │
│    │    - Validate category (pothole/streetlight/garbage/water)   │    │
│    │    - Validate severity (low/medium/high/critical)            │    │
│    │    - Fallback to keyword matching if AI fails                │    │
│    │                                                                │    │
│    │  Step 5: Return Standardized Response                       │    │
│    │    {                                                          │    │
│    │      category: "pothole",                                     │    │
│    │      severity: "high",                                        │    │
│    │      diagnosis: "Deep pothole 40cm diameter causing...",     │    │
│    │      simulated: false                                         │    │
│    │    }                                                          │    │
│    └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│    ┌─────────────────────────────────────────────────────────────┐    │
│    │  ENDPOINT 2: POST /tools/generate.email                     │    │
│    │  Purpose: Generate formal emails to authorities             │    │
│    │  Similar flow to classify.report with custom prompt         │    │
│    └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│    ┌─────────────────────────────────────────────────────────────┐    │
│    │  ENDPOINT 3: POST /tools/generate.tweet                     │    │
│    │  Purpose: Generate citizen engagement tweets                │    │
│    │  Similar flow to classify.report with custom prompt         │    │
│    └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
│    ┌─────────────────────────────────────────────────────────────┐    │
│    │  KEY FEATURES                                               │    │
│    │  - Zero dependencies (pure Node.js built-ins)              │    │
│    │  - Simple HTTP/JSON protocol (no JSON-RPC)                 │    │
│    │  - Docker containerized (FROM node:22-alpine)              │    │
│    │  - Error handling with fallback to keyword matching        │    │
│    │  - Fast response time (< 3 seconds AI inference)           │    │
│    │  - Health check endpoint: GET /health                      │    │
│    └─────────────────────────────────────────────────────────────┘    │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘

**WHY CUSTOM MCP GATEWAY vs OFFICIAL MCP SDK?**

1. **Simplicity**: 316 lines of code vs 1000s in official SDK
2. **Learning**: Full control and understanding of every line
3. **Performance**: Direct HTTP with zero abstraction overhead
4. **Specificity**: Tailored exactly to Cerebras API requirements
5. **Hackathon-Ready**: Easy to demo, explain, and troubleshoot

**NOT USING**: Official MCP SDK (@modelcontextprotocol/sdk), JSON-RPC protocol
**INSPIRED BY**: MCP architecture pattern (gateway provides model context)
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REQUEST → RESPONSE FLOW                              │
└─────────────────────────────────────────────────────────────────────────┘

[Browser/Mobile]
      │
      │ POST /api/reports
      │ { description, photo: File, lat, lng }
      │
      ▼
┌──────────────────────────┐
│  Next.js API Route       │
│  (Server-Side)           │
│                          │
│  1. Validate input       │ ← Zod schema validation
│  2. Extract EXIF GPS     │ ← piexifjs library
│  3. Upload to CDN        │ ← Cloudflare (optional)
│  4. Save to DB           │ ← Prisma → PostgreSQL
│     └─ status: pending   │
└──────────┬───────────────┘
           │
           │ Trigger AI Classification
           │
           ▼
┌──────────────────────────────────────────┐
│  Custom MCP Gateway (Docker :8008)       │
│  Node.js HTTP Server (316 lines)         │
│                                           │
│  POST /tools/classify.report             │
│  { description: "Large pothole..." }     │
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │ Prompt Engineering:                 │ │
│  │ "Classify this infrastructure       │ │
│  │  issue: [description]               │ │
│  │  Categories: pothole, streetlight,  │ │
│  │  garbage, water-leak                │ │
│  │  Respond with JSON only"            │ │
│  └─────────────────────────────────────┘ │
└──────────┬───────────────────────────────┘
           │
           │ HTTPS Request
           │ POST https://api.cerebras.ai/v1/chat/completions
           │ { model: "llama3.3-70b", messages: [...] }
           │
           ▼
┌──────────────────────────────────────────┐
│  Cerebras Cloud API                      │
│  (External Service)                      │
│                                           │
│  LLaMA 3.3-70B Inference                 │
│  - Ultra-fast inference (< 3 seconds)    │
│  - Wafer-scale AI compute                │
│  - RESTful API endpoint                  │
└──────────┬───────────────────────────────┘
           │
           │ AI Response (JSON)
           │ { choices: [{ message: { content: "{...}" } }] }
           │
           ▼
┌──────────────────────────────────────────┐
│  Custom MCP Gateway (Response Parsing)   │
│                                           │
│  1. Extract JSON from AI response        │
│  2. Validate category/severity           │
│  3. Handle errors & fallbacks            │
│  4. Return standardized format:          │
│     {                                    │
│       category: "pothole",               │
│       severity: "high",                  │
│       diagnosis: "Deep pothole...",      │
│       simulated: false                   │
│     }                                    │
└──────────┬───────────────────────────────┘
           │
           │ HTTP Response (JSON)
           │
           ▼
┌──────────────────────────┐
│  Next.js Backend         │
│                          │
│  1. Parse MCP response   │
│  2. Update PostgreSQL:   │
│     - category           │
│     - severity           │
│     - diagnosis          │
│     - ai_email_content   │
│     - status: classified │
│  3. Track AI usage       │
│     (rate limiter)       │
└──────────┬───────────────┘
           │
           │ Return to client
           │
           ▼
┌──────────────────────────┐
│  Browser Response        │
│  { reportId, redirect }  │
│                          │
│  → Navigate to           │
│    /report/:id           │
└──────────────────────────┘
```

### Component Architecture (Frontend)

```
src/app/
├── (home)/
│   └── page.tsx ────────────► Landing Page
│       ├── <ReportForm/>         ← GPS detection
│       │   ├── useGeolocation()  ← React hook
│       │   ├── <FileUpload/>     ← Photo capture
│       │   └── <SubmitButton/>   ← Form submission
│       └── <Footer/>             ← Info links
│
├── report/
│   └── [id]/
│       └── page.tsx ───────────► Report Details
│           ├── Display AI results
│           ├── <NotifyButton/>   ← Email authorities
│           ├── <TweetButton/>    ← Post to Twitter
│           └── <MapPreview/>     ← Leaflet mini-map
│
├── dashboard/
│   └── page.tsx ───────────────► Map Dashboard
│       ├── <LeafletMap/>         ← Interactive map
│       │   ├── <MarkerCluster/>  ← Grouped pins
│       │   └── <ReportPopup/>    ← Click details
│       ├── <FilterBar/>          ← Category filters
│       └── <StatusLegend/>       ← Color coding
│
└── api/
    ├── reports/
    │   ├── route.ts ──────────► POST create, GET list
    │   └── [id]/
    │       ├── classify/
    │       │   └── route.ts ──► AI classification
    │       ├── notify/
    │       │   └── route.ts ──► Send email
    │       └── tweet/
    │           └── route.ts ──► Post Twitter
    └── cron/
        └── route.ts ──────────► Twitter bot monitor
```

---

## Tech Stack

### Core Technologies
- **Framework** – [Next.js 15](https://nextjs.org/) (App Router with Turbopack), [React 19](https://react.dev/)
- **Language** – [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Database** – [PostgreSQL 17.5 Alpine](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **AI Model** – [Cerebras LLaMA](https://cerebras.ai/) via [MCP Gateway](https://modelcontextprotocol.io/)

### Infrastructure
- **Containerization** – [Docker](https://www.docker.com/) & Docker Compose
- **Package Manager** – [pnpm](https://pnpm.io/) (faster, disk-efficient)
- **Maps** – [Leaflet](https://leafletjs.com/) with OpenStreetMap
- **Email** – [Nodemailer](https://nodemailer.com/) with SMTP
- **Social** – [Twitter API v2](https://developer.twitter.com/)

### Development & Testing
- **Testing** – [Vitest](https://vitest.dev/) for integration tests
- **Linting** – [ESLint](https://eslint.org/) with TypeScript config
- **Git Hooks** – [Husky](https://typicode.github.io/husky/) for pre-commit checks
- **Validation** – [Zod](https://zod.dev/) schemas
- **Styling** – [Tailwind CSS](https://tailwindcss.com/)


---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **pnpm** (Install: `npm install -g pnpm`)
- **Git** ([Download](https://git-scm.com/))

### Quick Start (5 minutes)

#### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/akshayaparida/bengaluru-infra-aiagent.git
cd bengaluru-infra-aiagent

# Install dependencies
pnpm install
```

#### 2. Environment Setup

**Important:** Next.js uses `.env.local` for local development and `.env` for production.

```bash
# Copy environment template for local development
cp .env.example .env.local

# Edit .env.local with your API keys
# Required: CEREBRAS_API_KEY (get from https://cerebras.ai/)
# Optional: Twitter API keys for social features
```

**Environment file priority (Next.js loads in this order):**
1. `.env.local` - Local development (highest priority, gitignored)
2. `.env` - Production/shared config (can be committed)
3. `.env.example` - Template with dummy values

**Minimum required `.env.local` configuration:**
```env
CEREBRAS_API_KEY=your_cerebras_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/infra?schema=public
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=demo@localhost
MCP_BASE_URL=http://localhost:8008
```

> **Note:** If you have an existing `.env` file (e.g., for production/Supabase), keep it. Next.js will prefer `.env.local` for local development. Both files are gitignored for security.

#### 3. Start Services

```bash
# Start PostgreSQL and MCP Gateway via Docker
docker compose up -d

# Wait 5 seconds for containers to initialize
sleep 5

# Setup database schema
pnpm prisma migrate dev

# Seed sample data (optional)
node scripts/seed-sample-reports.ts
```

#### 4. Run Application

```bash
# Start all services (Next.js + MCP Gateway)
pnpm dev:all
# OR use the script directly: ./start-all.sh

# This will start:
# - MCP Gateway (AI service) on port 8008
# - Next.js dev server on port 3000
# - Show live logs from both services
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

#### 5. Stop Services

```bash
# Stop all services gracefully
pnpm stop
# OR use the script directly: ./stop-all.sh
```

### Mobile Access (Optional)

To test on your smartphone:

```bash
# Find your laptop's local IP
ip addr show | grep "inet " | grep -v 127.0.0.1
# Or on macOS: ifconfig | grep "inet " | grep -v 127.0.0.1

# Access from phone: http://<your-ip>:3000
```

### Verify Installation

```bash
# Check Docker containers
docker ps | grep bia

# Should show:
# bia-postgres (PostgreSQL 17.5)
# bia-mcp (MCP Gateway)

# Test MCP Gateway
curl http://localhost:8008/health
# Should return: {"status":"ok","service":"mcp-gateway","cerebras":"connected"}

# Test Next.js
curl http://localhost:3000
# Should return HTML
```

For detailed setup and troubleshooting, see [Architecture Guide](./docs/SYSTEM-ARCHITECTURE-STUDY-GUIDE.md).

---

## Development

### Available Scripts

```bash
# Start all services (Next.js + MCP Gateway)
pnpm dev:all

# Start Next.js only (without AI features)
pnpm dev

# Start MCP Gateway only (AI service on port 8008)
pnpm dev:ai

# Stop all services
pnpm stop

# Run tests
pnpm test          # Integration tests with Vitest
pnpm test:ui       # Tests with UI dashboard
pnpm e2e           # End-to-end tests with Playwright

# Database management
pnpm prisma studio        # Open Prisma Studio GUI
pnpm prisma migrate dev   # Create and apply migrations
pnpm prisma generate      # Generate Prisma Client

# Production build
pnpm build         # Build for production
pnpm start         # Start production server

# Code quality
pnpm lint          # Run ESLint
```

### Service Logs

When running `pnpm dev:all`, logs are saved to:
- `logs/nextjs.log` - Next.js server logs
- `logs/mcp-gateway.log` - MCP Gateway (AI) logs

```bash
# View live logs
tail -f logs/nextjs.log
tail -f logs/mcp-gateway.log
```

### Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   │   ├── reports/      # CRUD operations
│   │   └── cron/         # Twitter bot
│   ├── dashboard/        # Map view
│   └── report/           # Report form
├── lib/
│   ├── classify.ts       # AI classification
│   ├── twitter-monitor.ts # Bot logic
│   └── rate-limit-tracker.ts
└── types/
```

---

## Documentation

- **[Architecture Guide](./docs/SYSTEM-ARCHITECTURE-STUDY-GUIDE.md)** – Complete technical documentation
- **[AI Cost Control](./docs/AI-COST-CONTROL.md)** – Managing Cerebras API usage and costs
- **[POC Document](./docs/POC.md)** – Original proof of concept
- **[Cheat Sheet](./docs/CHEAT-SHEET.md)** – Quick reference for commands and concepts
- **[Flashcards](./docs/FLASHCARDS.md)** – Interview preparation guide

---

## Hackathon Submission

### FutureStack GenAI Hackathon by WeMakeDevs

**Event**: FutureStack GenAI Hackathon - October 2025  
**Community**: [WeMakeDevs](https://wemakedevs.org/)  
**Theme**: Building the future with AI and cloud-native tech

### Technologies Used

- ✅ **Cerebras LLaMA** - AI model for issue classification and smart email generation
- ✅ **Docker MCP Gateway** - Model Context Protocol gateway for AI integration
- ✅ **Meta LLaMA** - Underlying language model architecture



---



## Acknowledgments

- **[Cerebras](https://cerebras.ai/)** - For providing LLaMA API access and sponsoring the hackathon
- **[Meta](https://ai.meta.com/llama/)** - For the LLaMA model architecture
- **[Docker](https://www.docker.com/)** - For MCP Gateway and containerization sponsorship
- **[WeMakeDevs](https://wemakedevs.org/)** - For organizing FutureStack GenAI Hackathon
- **Bengaluru Citizens** - For inspiration and the real-world problem this solves
- **Open Source Community** - For the amazing tools and libraries

---

<div align="center">

**[Documentation](./docs/)** • **[Report Issues](https://github.com/akshayaparida/bengaluru-infra-aiagent/issues)**

Built with ❤️ for Bengaluru by [Akshaya Parida](https://github.com/akshayaparida)

**FutureStack GenAI Hackathon 2025** | Powered by Cerebras LLaMA & Docker MCP Gateway

</div>


