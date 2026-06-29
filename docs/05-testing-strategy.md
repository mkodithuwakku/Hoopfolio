# Testing Strategy

## Current Tests

| Test File | Coverage |
| --- | --- |
| `tests/pricing.test.mjs` | Fantasy scoring, expected fantasy points, return caps, low-projection protection, loyalty discount |
| `tests/market-lock.test.mjs` | Open before first game, locked after first game, next-morning open |
| `tests/search.test.mjs` | Name/team/position search, filters, sort order |

Run with:

```bash
npm test
```

## MVP Test Plan

| Area | Required Coverage |
| --- | --- |
| Pricing | Superstar beat/miss, role player breakout, tiny projection, injured player, postponed game |
| Projection | Weighted season/last 10/last 5 math, missing data fallback |
| Boost | Eligibility, cap, decay, minimum investment threshold, settlement explanation |
| Market lock | Race at lock time, postponed first game, timezone handling, server/client mismatch |
| Transactions | Overspend, duplicate idempotency key, sell too many shares, concentration limit |
| Settlement | Re-run idempotency, stat correction, DNP, traded player, missing projection |
| Leaderboards | Tie-breakers, minimum eligibility, reproducibility |
| Search | Filters, saved presets, empty states, pagination, sorting |
| Data ingestion | Provider outage, malformed rows, retry, raw cache persistence |

## Cache Rule For Tests

Automated tests must not use live NBA APIs. All tests should use deterministic local fixtures from `src/data/cache/` or inline test fixtures.
