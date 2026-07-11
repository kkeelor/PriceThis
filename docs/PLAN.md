# PriceThis — Build Plan (v1)

## Locked decisions

| Area | Decision |
|------|----------|
| Mobile | **Bare React Native 0.86** + TypeScript |
| Camera | **react-native-vision-camera** (native perf/control) |
| AI | **Claude API** (vision + text) via serverless proxy |
| Valuation | Claude primary; **market-data hook** ready for enrichment when high-confidence matches exist |
| Currency/locale | **Device locale** via `react-native-localize` |
| Backend | **Serverless** in `/server` (Vercel-first; Cloudflare Workers possible later) |
| Secrets | Claude key **server-side only** — never in the mobile app |

## Architecture

```text
Mobile (bare RN)
  ├── Camera / Gallery / Search
  ├── Local history (MMKV)
  └── API client → serverless /api/scan/*
                        └── Claude + optional market data
```

## MVP phases (unchanged scope)

1. Foundation — **in progress**
2. Design system
3. Home screen
4. Camera + detection overlay
5. Claude recognition (wired)
6. Valuation + Wow insight
7. Result screen
8. Curiosity cards
9. Search
10. Uploads + share intent
11. Personalization
12. Share cards
13. Collections/history + privacy
14. Error handling
15. Analytics
16. Performance polish
17. QA + release

## Repo layout

```text
/
├── android/ ios/          # bare RN native projects
├── src/                   # mobile app source
├── server/                # serverless API (Vercel)
├── PriceThis-v1 spec.md   # product spec
└── docs/PLAN.md           # this file
```

## Local dev

### Mobile

```bash
npm install
cp .env.example .env
cd ios && pod install && cd ..
npm run ios   # or npm run android
```

Set `API_BASE_URL` to your deployed or local server URL.

### API

```bash
cd server
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY
npm run dev            # vercel dev
```

## Market data strategy (v1)

- Ship fast with Claude estimates + honest confidence scoring.
- Keep `server/lib/market-data.ts` as the integration seam.
- Add provider-specific lookups (vehicles, watches, real estate) only when they materially improve UX for matched categories.

## Deploy note

Choose **Vercel vs Cloudflare** at deploy time. Current handlers are Vercel-shaped; Cloudflare migration = port handlers to Workers fetch API.
