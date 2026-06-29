# Hoopfolio

Hoopfolio is a free-to-play NBA player stock market game. Users receive a weekly coin budget, build a portfolio of NBA player stocks, trade only during open market windows, and compete on weekly leaderboards.

This initial implementation is intentionally cache-first. It uses local seed data and local calculation engines so development and tests do not call an NBA data API. Live providers can be added later behind the data provider abstraction.

## Current Slice

- Static analytics dashboard served by a small Node server.
- Clickable test market simulator using local previous-season-style seed data.
- Local cached teams, players, games, projections, and weekly market state.
- Disk-backed portfolio, trades, week advancement, leaderboard, and reset flow.
- Pricing engine based on fantasy performance versus expectations.
- Loyalty boost calculation with capped purchase discount.
- Search/filter/sort engine for stock discovery.
- Server-side market lock helper.
- Node test coverage for pricing, search, and market lock rules.
- Product, architecture, API, data-cache, roadmap, and testing documents.

## Run Locally

```bash
npm start
```

Then open `http://localhost:4173`.

The test app lets you:

- Buy player stocks with local test coins.
- Sell current holdings.
- Advance the simulated week one market day at a time.
- Reset the week and replay the same fixture.
- See portfolio value, transaction audit history, and leaderboard rank update.
- Scan player headshots, team logos, trend arrows, and signal chips.
- Open the Guide button for a guided tour through the major sections.

Local simulator state is stored in `.cache/hoopfolio-test-state.json` and is ignored by git.

## Run Tests

```bash
npm test
```

## API Usage Policy

During MVP development, no tests or local UI flows should call live NBA APIs. All data needed for repeatable development should be checked into `src/data/cache/` or generated into a local cache file. See [docs/03-data-cache-strategy.md](docs/03-data-cache-strategy.md).

The current simulator fixture is `src/data/cache/sim-week-2024-25.json`. It is hand-seeded previous-season-style data for product testing, not an official NBA dataset.

## Visual Assets

The prototype currently references NBA CDN player headshots and team logos in the local simulator fixture, with generated SVG fallbacks if those images fail to load. For a public/commercial release, confirm licensing and asset-use rights before relying on official NBA/player/team imagery.

## What To Work On Next

Recommended next steps:

1. Convert the prototype into a proper app stack, likely React/Next.js plus a small backend API.
2. Add persistent users, sessions, portfolios, transactions, and weekly contests with PostgreSQL.
3. Replace the hand-seeded simulator with recorded previous-season data cached locally.
4. Add player profile pages with charts, result stock value explanations, and game logs.
5. Build a transaction preview modal with concentration warnings and boost explanations.
6. Add admin controls for fixture resets, data ingestion status, stat corrections, and settlement replay.
7. Expand tests around full-week settlement, stat corrections, postponed games, and leaderboard tie-breakers.
8. Decide the first real data provider and implement a cache-first ingestion adapter with strict rate limiting.
