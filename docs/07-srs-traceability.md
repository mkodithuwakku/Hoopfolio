# SRS Traceability

This repo was scaffolded from `/Users/mkodi/Downloads/Hoopfolio SRS-PRD.pdf`.

## Implemented Now

| SRS Area | Repo Artifact |
| --- | --- |
| Free-to-play MVP decisions | `docs/01-product-brief.md` |
| Next app/API stack | `app/page.jsx`, `app/api/**/route.js` |
| Provider abstraction and local data | `src/data/providers/testMarketProvider.mjs`, `docs/03-data-cache-strategy.md` |
| Search stocks | `src/domain/search.mjs`, dashboard search table |
| Trending stocks | Dashboard trending rail from local market scores |
| Buy-low candidates | Dashboard buy-low rail from explainable signals |
| Roster/team data | Recorded replay fixture team/player data |
| Player stock values | `src/domain/pricing.mjs` |
| Result stock explanation | Dashboard table and pricing engine explanation |
| Loyalty boosts | `calculateLoyaltyDiscount` in `src/domain/pricing.mjs` |
| Market lock | `src/domain/marketLock.mjs` |
| Working test market | `src/data/cache/recorded/2024-25/espn-midseason-week-2025-01-06.json`, `src/data/providers/testMarketProvider.mjs` |
| Real previous-season replay ingest | `scripts/ingest-espn-replay.mjs`, `.cache/provider-raw/espn/nba/2024-25/` |
| Buy/sell local trades | `src/domain/trading.mjs`, `/api/trades/buy`, `/api/trades/sell` |
| Week simulation | `/api/sim/advance-day`, `/api/sim/reset`, `.cache/hoopfolio-test-state.json` |
| Users and sessions | `src/data/persistence/localStore.mjs`, `/api/auth/session`, `/api/auth/google-demo` |
| Profile API shape | `/api/profile` |
| Leaderboard API shape | `/api/leaderboards/live`, `/api/leaderboards/weekly` |
| Player portraits and badges | `public/main.js`, `public/styles.css` |
| Guided tutorial | `#tutorialOverlay` in `app/page.jsx`, tutorial controller in `public/main.js` |
| Testing strategy | `docs/05-testing-strategy.md`, `tests/*.test.mjs` |
| API plan | `docs/04-api-contract.md` |
| Architecture | `docs/02-architecture.md` |

## Next Implementation Targets

1. Move file-backed users/sessions/portfolios/transactions to PostgreSQL.
2. Replace Google sign-in demo with real Google OAuth.
3. Add dedicated profile and portfolio statistics screens.
4. Add dedicated live, weekly, and historical leaderboard screens.
5. Add admin ingestion status and raw cache management.
6. Add watchlist and saved filters.
