# Next Phase Plan

## Current Baseline

Hoopfolio now runs as a Next.js app with backend route handlers and cache-first market data. The default replay week is `src/data/cache/recorded/2024-25/midseason-week-2025-01-06.json`, which includes a 2024-25 midseason test week plus four prior weeks of player context. Local test state stays in `.cache/` so development does not call NBA providers.

## Recorded Data Replacement

The next ingestion milestone is to replace the normalized replay fixture with an approved provider dump:

1. Add an ingestion command such as `npm run ingest:season -- --season=2024-25`.
2. Fetch only during explicit ingestion runs, never from normal UI requests.
3. Save raw provider responses under `.cache/provider-raw/<provider>/<season>/`.
4. Normalize raw games, players, box scores, injuries, and fantasy projections into `src/data/cache/recorded/<season>/`.
5. Keep deterministic replay weeks in git when they are small enough for tests.
6. Store large historical caches outside git with checksums and setup instructions.

## Next Season Scalability

The app should choose contests and replay/live weeks by season metadata, not by hardcoded fixture names.

Required work:

- Add a `SeasonRepository` abstraction for available seasons, weeks, contests, and ingestion status.
- Add provider modes: `local`, `recorded`, and `live-ingestion`.
- Make contest creation derive from real NBA schedule windows.
- Add stat-correction replay so a changed box score can rebuild prices, holdings, and leaderboards.
- Add cache invalidation by contest ID and player ID.

## Persistence Milestone

File-backed state is useful for local development, but production needs a database.

Recommended first schema:

| Entity | Purpose |
| --- | --- |
| users | Profile and auth identity |
| sessions | Login sessions and provider metadata |
| contests | Weekly market windows and status |
| portfolios | User entry per contest |
| holdings | Current player-share positions |
| transactions | Buy/sell audit trail |
| leaderboard_entries | Live and settled rank rows |
| portfolio_snapshots | Weekly and historical portfolio metrics |
| ingestion_runs | Provider fetch, normalize, and replay status |

## Google Sign-In

The current button calls `/api/auth/google-demo` and writes a local demo session. Replace this with real Google OAuth after the persistence schema lands.

Implementation path:

1. Add auth environment variables for Google client ID/secret and callback URL.
2. Add an auth adapter that persists users and sessions.
3. Protect portfolio and transaction writes with the active session user.
4. Keep local demo auth available in development mode only.

## Product Screens

After profiles and auth are real, add:

- `Profile`: user identity, joined contests, weekly and all-time returns.
- `My Portfolio`: current week holdings, transaction history, realized/unrealized return, concentration warnings.
- `Historical Portfolio`: weekly snapshots, rank trend, best/worst trades.
- `Live Leaderboard`: rank movement during the active contest.
- `Weekly Leaderboard`: final weekly results and prizes/badges.
- `Historical Leaderboards`: previous contests by season and week.
