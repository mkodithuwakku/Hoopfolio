# Roadmap

## Phase 0: Prototype

Features:

- Static dashboard.
- Seeded local player and schedule data.
- Mock stock prices.
- Pricing, boost, search, and market lock engines.
- Local API endpoints.

Acceptance criteria:

- Dashboard loads from local cache.
- Tests run without network access.
- Stock value explanations are visible.
- No live NBA API calls happen during normal development.

## Phase 1: Core MVP

Features:

- Authentication.
- Weekly global contest.
- Coin budget.
- Search stocks.
- Player profiles.
- Buy/sell.
- Portfolio.
- Market lock.
- Basic settlement.
- Weekly leaderboard.

Dependencies:

- PostgreSQL schema.
- Transaction engine.
- Admin correction/audit foundation.

Risks:

- Market lock edge cases.
- Pricing fairness.
- Data source reliability.

## Phase 2: Discovery And Boosts

Features:

- Trending stocks.
- Buy-low candidates.
- Loyalty boosts.
- Watchlists.
- Roster views.
- Advanced filters.

Acceptance criteria:

- Buy-low and trending explanations are understandable.
- Boosts are capped and visible before purchase.
- Filters remain fast on mobile and desktop.

## Phase 3: Advanced Analytics

Features:

- Better projections.
- Volatility modeling.
- Ownership trends.
- Similar players.
- Historical stock charts.
- More settlement recaps.

## Phase 4: Social And Expansion

Features:

- Private leagues.
- Friend leaderboards.
- Shareable recaps.
- Badges and cosmetics.
- Mobile app.
- Other sports.
