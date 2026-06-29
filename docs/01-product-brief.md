# Hoopfolio Product Brief

## Confirmed Decisions

| Area | MVP Decision |
| --- | --- |
| Product name | Hoopfolio |
| Product type | Free-to-play NBA player stock market game |
| Money model | No deposits, cash-outs, paid contests, gambling, prizes, betting odds, or sportsbook integrations |
| Contest format | Global weekly contests |
| Economy | Fixed weekly coin budget, recommended MVP default is 10,000 coins |
| Trading | Buy/sell only during open market windows before the first NBA game of each day |
| Pricing | Player stock values are based on fantasy performance versus expectations |
| Boosts | Loyalty boosts reward repeat investment, must be capped and transparent |
| Data | Local seeded data first, free/low-complication provider later, paid provider migration possible |
| Assets | Avoid copyrighted NBA logos, team marks, official photos, and protected branding |

## MVP Assumptions

1. Weekly contests reset coins and portfolios each week; loyalty history persists across weeks.
2. Fractional shares are allowed to make portfolios easier to build with a fixed budget.
3. No transaction fees in MVP.
4. A single global daily lock closes the full market before the first eligible NBA game of the day.
5. The backend is the source of truth for all lock checks and transaction timestamps.
6. Loyalty boost applies as a purchase discount, not a return multiplier, for simpler user explanation and cleaner settlement math.
7. Test and development data must be cached locally and reusable without API calls.

## Core Gameplay Loop

1. User joins the current weekly contest.
2. User receives 10,000 virtual coins.
3. User searches player stocks using filters, trend signals, buy-low signals, rosters, and profiles.
4. User buys fractional shares before the daily market lock.
5. Player fantasy production updates stock value relative to projection.
6. User may sell or rebalance during later open windows.
7. Weekly settlement finalizes holdings and leaderboard ranks.
8. Loyalty progress updates for repeat player investments.

## MVP Feature Scope

| Feature | Scope |
| --- | --- |
| Stock search | Search by name/team/position and filter by price, projection, ownership, trend, buy-low, boost eligibility, games remaining, risk |
| Trending | Market movers, most bought, most sold, rising/falling players, schedule and injury opportunity signals |
| Buy low | Explainable candidates based on price drop, stable minutes, projection edge, low ownership, schedule, and recent slump |
| Player profile | Header, pricing, projection, fantasy stats, result stock value, explainability, user holding context |
| Portfolio | Starting coins, cash, holdings, realized/unrealized returns, allocation, transaction history |
| Trading | Preview, buy, sell, audit trail, server-side lock rejection |
| Leaderboards | Weekly global rank by net value and percentage return |
| Admin | Ingestion status, replay settlement, override data, audit logs |

## Out Of Scope For MVP

- Real-money contests or prizes.
- Private leagues.
- Native mobile apps.
- Official NBA marks, logos, or player photos.
- Complex market-making.
- Real-time play-by-play pricing.
- User-generated projections.
- Paid/commercial data provider integration.

## Product Risks

| Risk | Mitigation |
| --- | --- |
| Free data source rate limits | Cache-first development, provider abstraction, scheduled ingestion, local fixtures |
| Data licensing uncertainty | Avoid official assets, document source terms, legal review before public launch |
| Stock pricing feels unfair | Auditable formulas, caps, low-projection protection, example calculations |
| Loyalty boosts overpower skill | Purchase discount only, minimum investment threshold, 1%-5% cap, decay |
| Market lock edge cases | Backend lock service, transaction timestamps, idempotent rejection, audit logs |
| User confusion | Explain result stock value and every stock movement driver on cards and profiles |
