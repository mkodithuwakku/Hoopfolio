# Data Cache Strategy

## Goal

Avoid unnecessary NBA API usage during development and testing. Disk space is preferred over repeated API calls.

## Current Rule

Tests, local UI development, and deterministic demos must use files under `src/data/cache/`. The first implementation does not call any external NBA API.

## Cache Layout

| Path | Purpose |
| --- | --- |
| `src/data/cache/teams.json` | Neutral team metadata without logos or official marks |
| `src/data/cache/players.json` | Player identity, team, position, status, and local market fields |
| `src/data/cache/games-week-2026-01.json` | Example weekly schedule and daily lock inputs |
| `src/data/cache/weekly-market-2026-01.json` | Projections, performance, ownership, trend, buy-low, loyalty, and price inputs |
| `src/data/cache/sim-week-2024-25.json` | Legacy seed fixture kept for comparison |
| `src/data/cache/recorded/2024-25/midseason-week-2025-01-06.json` | Current local recorded-cache replay fixture with four prior weeks of context |
| `.cache/hoopfolio-test-state.json` | Local ignored simulator state: day progress, portfolio, holdings, transactions |
| `.cache/hoopfolio-app-state.json` | Local ignored app state: users, demo sessions, contests, and future profile snapshots |

## Provider Policy

The app should access data through provider modules, never directly through a live API inside UI or domain code.

Provider order for development:

1. Local recorded provider responses.
2. Local cache provider.
3. Manual seed files.
4. Live free provider only for explicit ingestion tasks.

## Future Ingestion Rules

When live NBA data is introduced:

1. Fetch on a schedule, not per user request.
2. Persist raw provider responses before transforming them.
3. Store normalized rows for app reads.
4. Use ETag, last-modified, date windows, and provider-specific throttles where available.
5. Add an ingestion run record for every fetch.
6. Make tests run against recorded fixtures, not live provider calls.
7. Add a kill switch that forces local-cache mode.

## Environment Flags

| Variable | Planned Purpose |
| --- | --- |
| `HOOPFOLIO_DATA_MODE=local` | Only read local cache files |
| `HOOPFOLIO_DATA_MODE=recorded` | Read saved provider responses |
| `HOOPFOLIO_DATA_MODE=live` | Allow live provider calls for controlled ingestion only |
| `HOOPFOLIO_PROVIDER_RATE_LIMIT_PER_MINUTE` | Local throttle for provider adapters |
| `HOOPFOLIO_DISABLE_LIVE_PROVIDER=true` | Hard block live calls |

## Test State Guidance

- Keep small deterministic fixtures in git.
- Put larger generated caches in a documented cache directory and checksum them.
- Use fixed contest IDs and dates in tests.
- Never make unit tests depend on the current NBA schedule.
- Add replay fixtures for stat corrections, postponed games, DNPs, and provider outages.

## Current Simulator

The working test application uses `recorded/2024-25/midseason-week-2025-01-06.json`. The file is intentionally local and repeatable. It contains team/player identity, expected fantasy points, daily fantasy outcomes, four prior weekly averages per player, trend scores, buy-low scores, loyalty weeks, and bot leaderboard progress.

Important: this fixture uses the recorded-cache shape the app needs, but it should still be refreshed from an approved provider dump before public use. The provider ingestion job should save raw source responses first, then write this normalized replay file.

## Image And Logo Policy

For this personal prototype, the fixture references NBA CDN headshots and logos with generated fallbacks. For public/commercial release, cache approved assets locally with source metadata, license notes, and a repeatable refresh process.
