# furnest-home.com

Production-oriented eCommerce platform foundation built with Next.js App Router, TypeScript, PostgreSQL, Prisma, Redis, Authorize.net, and Clean Architecture principles.

## Tech Stack

- Next.js (App Router + TypeScript)
- PostgreSQL + Prisma ORM
- Redis (caching/rate limiting + queue backend)
- Authorize.net (Accept.js + server-side transactions + webhooks)
- Zustand state store
- TailwindCSS

## Quick Start

1. Copy env values:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start dev server:

```bash
npm run dev
```

## Architecture Reference

See `docs/architecture.md` for:

- folder structure
- database schema explanation
- payment flow diagrams
- wallet ledger design
- API route structure
- deployment guide (Vercel + VPS)
- security checklist
- edge case handling
- production checklist

## Docker

```bash
docker compose up --build
```
