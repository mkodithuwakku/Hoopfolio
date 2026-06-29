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
| `src/data/cache/sim-week-2024-25.json` | Hand-seeded previous-season-style test simulator fixture |
| `.cache/hoopfolio-test-state.json` | Local ignored simulator state: day progress, portfolio, holdings, transactions |

## Provider Policy

The app should access data through provider modules, never directly through a live API inside UI or domain code.

Provider order for development:

1. Local cache provider.
2. Recorded provider responses.
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

The first working test application uses `sim-week-2024-25.json`. The file is intentionally local and repeatable. It contains neutral team labels, player names, expected fantasy points, simulated daily fantasy outcomes, trend scores, buy-low scores, loyalty weeks, and bot leaderboard progress.

Important: this fixture is not represented as official NBA data. It should be treated as hand-seeded product-test data until a recorded provider ingestion flow is added.

## Image And Logo Policy

For MVP development, use local generated portraits and neutral custom team badges. Do not fetch official player headshots, NBA logos, team logos, or protected marks during tests or normal local development. If licensed assets are added later, cache them locally with source metadata, license notes, and a repeatable refresh process.
