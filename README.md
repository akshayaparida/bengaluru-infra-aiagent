# Bengaluru Infrastructure AI Agent

<div align="center">

**AI-powered citizen reporting platform for infrastructure issues**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)](https://www.typescriptlang.org/)
[![Cerebras](https://img.shields.io/badge/Cerebras-LLaMA-green)](https://cerebras.ai/)
[![Coverage](https://img.shields.io/badge/Coverage-85%25-brightgreen)](./tests/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Demo](https://demo-url) • [Documentation](./docs/) • [Report Bug](https://github.com/your-repo/issues) • [Request Feature](https://github.com/your-repo/issues)

</div>

---

## Overview

A full-stack platform enabling Bengaluru citizens to report infrastructure issues (potholes, garbage, water leaks) with GPS + photo evidence. Uses AI classification via **Cerebras LLaMA**, automated notifications, and an intelligent Twitter bot that monitors government handles.

### Key Features

- **AI Classification** – Cerebras LLaMA categorizes issues automatically
- **Twitter Bot** – Monitors @GBA_office, @ICCCBengaluru for complaints
- **Real-time Dashboard** – Leaflet map showing all reports
- **Smart Notifications** – AI-crafted emails to authorities
- **Rate Limiting** – Window-based algorithm respecting Twitter API limits
- **85%+ Test Coverage** – Vitest + Playwright

### Built For

🏆 **[FutureStack GenAI hackathon]** – Using sponsor technologies (Cerebras LLaMA + Docker MCP Gateway)

---

## Tech Stack

- **Framework** – [Next.js 15](https://nextjs.org/) (App Router), [React 19](https://react.dev/)
- **Language** – [TypeScript](https://www.typescriptlang.org/) (Strict mode)
- **Database** – [PostgreSQL 17.5](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/)
- **AI** – [Cerebras LLaMA](https://cerebras.ai/) 🏆, [MCP Gateway](https://modelcontextprotocol.io/)
- **Maps** – [Leaflet](https://leafletjs.com/)
- **Testing** – [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/)
- **Deployment** – [Docker](https://www.docker.com/), AWS Lambda / Vercel
- **Validation** – [Zod](https://zod.dev/)
- **Styling** – [Tailwind CSS](https://tailwindcss.com/)


---

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop  
- pnpm

### Quick Start

```bash
# Clone and install
git clone <repo-url>
cd bengaluru-infra-aiagent
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your API keys

# Start services
docker compose up -d
pnpm prisma migrate dev

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

For detailed setup, see [Installation Guide](./docs/SYSTEM-ARCHITECTURE-STUDY-GUIDE.md).

---

## Development

```bash
# Start dev server
pnpm dev

# Run tests
pnpm test
pnpm e2e

# Database
pnpm prisma studio
pnpm prisma migrate dev

# Build for production
pnpm build
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

- [Architecture Guide](./docs/SYSTEM-ARCHITECTURE-STUDY-GUIDE.md) – Complete technical documentation
- [Production Deployment](./docs/PRODUCTION-DEPLOYMENT.md) – AWS Lambda, Vercel, EC2 guides  
- [POC Document](./docs/POC.md) – Original proof of concept
- [Cheat Sheet](./docs/CHEAT-SHEET.md) – Quick reference
- [Flashcards](./docs/FLASHCARDS.md) – Interview prep

---

## Deployment

Supports multiple deployment options:

- **AWS Lambda** ($1-5/month) – Serverless, auto-scaling  
- **Vercel** (Free) – One-click deployment
- **AWS EC2** ($10/month) – Traditional VPS

See [Production Deployment Guide](./docs/PRODUCTION-DEPLOYMENT.md) for detailed instructions.


---

## Hackathon

**Built for**: [Hackathon Name] – October 2025

**Sponsor Technologies**:
- ✅ Cerebras LLaMA (AI classification)
- ✅ Docker MCP Gateway (tool integration)

**Highlights**:
- Full-stack TypeScript with 85%+ test coverage
- Production-ready with AWS Lambda deployment
- Solves real problem for 10M+ Bengaluru citizens
- Complete documentation (5,000+ lines)
- Twitter bot with intelligent rate limiting

---

## Contributing

Contributions are welcome! Please read our [Contributing Guide](./CONTRIBUTING.md) first.

---

## License

MIT License – see [LICENSE](./LICENSE) for details.

---

## Acknowledgments

- [Cerebras](https://cerebras.ai/) for LLaMA API access
- [Docker](https://www.docker.com/) for MCP Gateway
- Bengaluru citizens for inspiration
- Hackathon organizers

---

<div align="center">

**[Website](https://demo-url)** • **[Documentation](./docs/)** • **[Issues](https://github.com/your-repo/issues)**

Made with ❤️ for Bengaluru

</div>


