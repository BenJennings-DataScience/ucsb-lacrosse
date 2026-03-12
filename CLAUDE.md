# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
npm start        # Start production server
```

## Architecture

**Purpose:** Fan dashboard for UCSB Men's Lacrosse (MCLA) — live stats, schedule, roster, travel map, and poll rankings scraped from mcla.us.

**Stack:** Next.js 16 (App Router) · TypeScript · React 19 · Tailwind CSS 4 · Supabase (PostgreSQL) · Cheerio (scraping) · Leaflet (maps)

### Data Flow

All data originates in `lib/scraper.ts`, which uses Cheerio to parse mcla.us HTML. Scraped data is cached in-memory with a **1-hour TTL**. API routes (`/app/api/*/route.ts`) call the scraper and return JSON. After returning to the client, `lib/supabaseSync.ts` runs a **fire-and-forget async sync** that persists data to Supabase for historical tracking.

```
mcla.us → lib/scraper.ts (Cheerio) → /api/* routes → page components
                                    ↘ lib/supabaseSync.ts → Supabase
```

### Key Files

| File | Role |
|------|------|
| `lib/scraper.ts` | All HTML scraping logic — schedule, stats, roster, player profiles, polls |
| `lib/supabaseSync.ts` | Async Supabase persistence (fire-and-forget, non-blocking) |
| `lib/supabase.ts` | Supabase client init |
| `app/map/coords.ts` | Lat/lng mappings for game venues + distance calculation from UCSB |
| `app/layout.tsx` | Root layout — metadata, OG tags, PWA icons |

### Pages and Their API Routes

| Page | Route | API |
|------|-------|-----|
| Home | `/` | reads schedule + stats directly |
| Schedule | `/schedule` | `/api/schedule` |
| Stats | `/stats` | `/api/stats` |
| Leaders | `/leaders` | `/api/stats` |
| Polls | `/polls` | `/api/polls` |
| Travel Map | `/map` | `/api/schedule` (for venues) |
| Player Profile | `/players/[slug]` | `/api/player/[slug]` |
| Search | — | `/api/search` |

### Supabase

Environment variables required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://gaucho-lax.vercel.app
```

### Leaflet / Map

The map uses `react-leaflet` and must be rendered client-side only. `MapWrapper.tsx` dynamically imports `TravelMapClient.tsx` with `{ ssr: false }` to avoid hydration errors.

### TypeScript Path Alias

`@/*` maps to the project root (e.g., `@/lib/scraper` resolves to `lib/scraper.ts`).
