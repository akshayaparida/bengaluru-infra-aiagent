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

[Demo Guide](./DEMO-GUIDE.md) • [Documentation](./docs/) • [Report Bug](https://github.com/akshayaparida/bengaluru-infra-aiagent/issues) • [Request Feature](https://github.com/akshayaparida/bengaluru-infra-aiagent/issues)

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

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your API keys
# Required: CEREBRAS_API_KEY (get from https://cerebras.ai/)
# Optional: Twitter API keys for social features
```

**Minimum required `.env.local` configuration:**
```env
CEREBRAS_API_KEY=your_cerebras_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/infra?schema=public
SMTP_HOST=localhost
SMTP_PORT=1025
FROM_EMAIL=demo@localhost
MCP_BASE_URL=http://localhost:8008
```

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

For detailed setup and troubleshooting, see [Demo Guide](./DEMO-GUIDE.md) and [Architecture Guide](./docs/SYSTEM-ARCHITECTURE-STUDY-GUIDE.md).

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

- **[Demo Guide](./DEMO-GUIDE.md)** – Step-by-step demo recording guide
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

### Sponsor Technologies Used

- ✅ **Cerebras LLaMA** - AI model for issue classification and smart email generation
- ✅ **Docker MCP Gateway** - Model Context Protocol gateway for AI integration
- ✅ **Meta LLaMA** - Underlying language model architecture

### Project Highlights

- **Full-stack TypeScript** - Type-safe from database to frontend
- **Production-ready** - Docker deployment, rate limiting, error handling
- **Real-world impact** - Solves civic infrastructure reporting for 10M+ Bengaluru citizens
- **Comprehensive documentation** - 5,000+ lines covering architecture, deployment, and interview prep
- **Intelligent automation** - Twitter bot monitoring with rate limiting and AI responses
- **Cost-conscious** - Daily AI usage limits with keyword fallback to control API costs
- **PWA enabled** - Installable mobile app with offline support
- **Test coverage** - Integration tests for all critical paths

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

---

## License

MIT License – see [LICENSE](./LICENSE) for details.

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

**[Demo Guide](./DEMO-GUIDE.md)** • **[Documentation](./docs/)** • **[Report Issues](https://github.com/akshayaparida/bengaluru-infra-aiagent/issues)**

Built with ❤️ for Bengaluru by [Akshaya Parida](https://github.com/akshayaparida)

**FutureStack GenAI Hackathon 2025** | Powered by Cerebras LLaMA & Docker MCP Gateway

</div>


