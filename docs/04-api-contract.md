# API Contract Draft

The current prototype exposes read-only local endpoints from `scripts/dev-server.mjs`. Production should expand these into authenticated REST endpoints.

## Prototype Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | Returns server and data mode status |
| GET | `/api/market/snapshot` | Returns current contest, lock status, and calculated stock rows from local cache |
| GET | `/api/market/search?q=&sort=` | Returns filtered stock rows |
| GET | `/api/teams` | Returns neutral team metadata |
| POST | `/api/trades/buy` | Buys a stock using local test coins |
| POST | `/api/trades/sell` | Sells a local holding |
| POST | `/api/sim/advance-day` | Applies the next simulated day of games |
| POST | `/api/sim/reset` | Resets ignored local simulator state |

## Production Endpoint Plan

| Module | Method | Path | Notes |
| --- | --- | --- | --- |
| Auth | POST | `/api/auth/signup` | Create account |
| Auth | POST | `/api/auth/login` | Create session |
| Contest | GET | `/api/contests/current` | Current weekly contest |
| Contest | POST | `/api/contests/current/join` | Join weekly contest |
| Market | GET | `/api/market/search` | Query, filters, sort, pagination |
| Market | GET | `/api/market/trending` | Trending stocks |
| Market | GET | `/api/market/buy-low` | Explainable buy-low candidates |
| Market | GET | `/api/market/lock-status` | Server-side lock state |
| Players | GET | `/api/players/:id` | Player profile |
| Players | GET | `/api/players/:id/result-stock-value` | Price explanation |
| Teams | GET | `/api/teams` | Team directory |
| Teams | GET | `/api/teams/:id/roster` | Roster table |
| Portfolio | GET | `/api/portfolio/current` | Holdings, cash, value |
| Trading | POST | `/api/trades/preview` | Validate and quote trade |
| Trading | POST | `/api/trades/buy` | Atomic buy transaction |
| Trading | POST | `/api/trades/sell` | Atomic sell transaction |
| Boosts | GET | `/api/boosts` | User boosts |
| Leaderboards | GET | `/api/leaderboards/weekly/:contestId` | Weekly ranks |
| Admin | GET | `/api/admin/ingestion-runs` | Data status |
| Admin | POST | `/api/admin/settlements/:contestId/replay` | Idempotent settlement replay |

## Required Error Cases

| Code | Meaning |
| --- | --- |
| `MARKET_LOCKED` | Transaction submitted after server-side lock |
| `INSUFFICIENT_COINS` | User lacks available cash |
| `INSUFFICIENT_SHARES` | User attempts to sell more than held |
| `DUPLICATE_TRANSACTION` | Idempotency key already processed |
| `PLAYER_NOT_ELIGIBLE` | Player cannot be traded in this contest |
| `CONCENTRATION_LIMIT` | Trade exceeds portfolio concentration rule |
| `STALE_QUOTE` | Preview quote is too old |
| `DATA_UNAVAILABLE` | Provider/cache data missing |
| `MIN_TRADE` | Trade amount is below the local minimum |
| `NO_POSITION` | User attempts to sell a player they do not hold |

## Transaction Requirements

- All trades must be timestamped by the backend.
- Client timestamps are informational only.
- Buy/sell must be atomic with balance and holdings updates.
- Every transaction requires an idempotency key.
- Rejected trades must still be audit logged.
- Market lock must be checked inside the transaction boundary.
