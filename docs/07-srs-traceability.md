# SRS Traceability

This repo was scaffolded from `/Users/mkodi/Downloads/Hoopfolio SRS-PRD.pdf`.

## Implemented Now

| SRS Area | Repo Artifact |
| --- | --- |
| Free-to-play MVP decisions | `docs/01-product-brief.md` |
| Provider abstraction and local data | `src/data/providers/localCacheProvider.mjs`, `docs/03-data-cache-strategy.md` |
| Search stocks | `src/domain/search.mjs`, dashboard search table |
| Trending stocks | Dashboard trending rail from local market scores |
| Buy-low candidates | Dashboard buy-low rail from explainable signals |
| Roster/team data | `src/data/cache/teams.json`, `players.json`, `/api/teams` |
| Player stock values | `src/domain/pricing.mjs` |
| Result stock explanation | Dashboard table and pricing engine explanation |
| Loyalty boosts | `calculateLoyaltyDiscount` in `src/domain/pricing.mjs` |
| Market lock | `src/domain/marketLock.mjs` |
| Working test market | `src/data/cache/sim-week-2024-25.json`, `src/data/providers/testMarketProvider.mjs` |
| Buy/sell local trades | `src/domain/trading.mjs`, `/api/trades/buy`, `/api/trades/sell` |
| Week simulation | `/api/sim/advance-day`, `/api/sim/reset`, `.cache/hoopfolio-test-state.json` |
| Neutral portraits and badges | `public/main.js`, `public/styles.css` |
| Guided tutorial | `#tutorialOverlay` in `public/index.html`, tutorial controller in `public/main.js` |
| Testing strategy | `docs/05-testing-strategy.md`, `tests/*.test.mjs` |
| API plan | `docs/04-api-contract.md` |
| Architecture | `docs/02-architecture.md` |

## Next Implementation Targets

1. Add persistent portfolio and transaction state.
2. Add player profile routes.
3. Add watchlist and saved filters.
4. Add admin ingestion status and raw cache management.
5. Add PostgreSQL schema migration once persistence begins.
