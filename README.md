# Hoopfolio

Hoopfolio is a free-to-play NBA player stock market game. Users receive a weekly coin budget, build a portfolio of NBA player stocks, trade only during open market windows, and compete on weekly leaderboards.

This implementation is intentionally cache-first. It uses a real ESPN NBA scoreboard/boxscore replay fixture and local calculation engines so development and tests do not call a live data API. Live providers can be added later behind the data provider abstraction.

## Current Slice

- Next.js app shell with backend route handlers under `/api/*`.
- Clickable test market simulator using a real 2024-25 midseason ESPN NBA replay cached locally.
- Local cached teams, players, games, projections, and weekly market state.
- Disk-backed users, sessions, portfolio state, trades, week advancement, leaderboard, and reset flow.
- Pricing engine based on fantasy performance versus expectations.
- Loyalty boost calculation with capped purchase discount.
- Search/filter/sort engine for stock discovery.
- Server-side market lock helper.
- Local Google sign-in demo endpoint and button. Real Google OAuth still needs credentials and an auth adapter.
- Node test coverage for pricing, search, and market lock rules.
- Product, architecture, API, data-cache, roadmap, and testing documents.

## Run Locally

```bash
npm start
```

Then open `http://localhost:4173`.

If port `4173` is already in use, stop the previous Hoopfolio server or run Next on another port with:

```bash
npx next dev -H 127.0.0.1 -p 4174
```

The test app lets you:

- Buy player stocks with local test coins.
- Sell current holdings.
- Advance the simulated week one market day at a time.
- Reset the week and replay the same fixture.
- See portfolio value, transaction audit history, and leaderboard rank update.
- Scan player headshots, team logos, trend arrows, and signal chips.
- Open the Guide button for a guided tour through the major sections.

Local simulator state is stored in `.cache/hoopfolio-test-state.json` and is ignored by git.
Local app identity/session state is stored in `.cache/hoopfolio-app-state.json` and is ignored by git.

## Ingest Real Replay Data

The checked-in replay fixture was generated from ESPN NBA scoreboard and boxscore JSON:

```bash
npm run ingest:espn-replay
```

By default this records the week of `2025-01-06` from the `2024-25` season and four prior weeks of context. Raw provider responses are saved to `.cache/provider-raw/espn/nba/2024-25/`; rerunning the command reuses those files instead of calling the provider again unless you pass `--force`.

Example override:

```bash
npm run ingest:espn-replay -- --season=2024-25 --week-start=2025-01-06 --max-players=12
```

The old static server is still available for comparison:

```bash
npm run legacy:start
```

## Run Tests

```bash
npm test
```

## API Usage Policy

During MVP development, no tests or local UI flows should call live NBA APIs. All data needed for repeatable development should be checked into `src/data/cache/` or generated into a local cache file. See [docs/03-data-cache-strategy.md](docs/03-data-cache-strategy.md).

The current simulator fixture is `src/data/cache/recorded/2024-25/espn-midseason-week-2025-01-06.json`. It is generated from real ESPN NBA scoreboard/boxscore data with four prior weeks of per-player context so midseason stock behavior can be tested without live calls.

## Visual Assets

The prototype currently references ESPN player headshots and team logos in the generated replay fixture, with generated SVG fallbacks if those images fail to load. For a public/commercial release, confirm licensing and asset-use rights before relying on provider/player/team imagery.

## What To Work On Next

Recommended next steps:

1. Move file-backed persistence to PostgreSQL with migrations for users, sessions, contests, portfolios, transactions, holdings, leaderboard entries, and ingestion runs.
2. Replace the Google sign-in demo with real Google OAuth using environment-based credentials.
3. Build dedicated profile and portfolio-stat screens for weekly and historical performance.
4. Build separate weekly, live, and historical leaderboard pages.
5. Add a provider ingestion command that records raw previous-season responses locally before normalization.
6. Add player profile pages with charts, result stock value explanations, and game logs.
7. Build a transaction preview modal with concentration warnings and boost explanations.
8. Add admin controls for fixture resets, data ingestion status, stat corrections, and settlement replay.
