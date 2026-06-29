import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSimSnapshot } from "../src/domain/simulator.mjs";
import { createInitialPortfolio } from "../src/domain/trading.mjs";

const fixture = {
  notice: "test",
  contest: { startingCoins: 10000 },
  teams: [],
  days: [
    { label: "Monday", date: "2025-01-01", games: ["A vs B"], marketLocksAt: "2025-01-01T00:00:00.000Z" },
    { label: "Tuesday", date: "2025-01-02", games: ["C vs D"], marketLocksAt: "2025-01-02T00:00:00.000Z" }
  ],
  players: [
    {
      id: "player-a",
      name: "Player A",
      teamId: "aaa",
      teamName: "Alpha",
      teamAbbreviation: "AAA",
      position: "G",
      status: "Active",
      openingPrice: 100,
      expectedFantasyPoints: 80,
      dailyFantasyPoints: [50, 40],
      projectedRemainingFantasyPoints: [40, 40],
      volatilityMultiplier: 1,
      ownershipPercent: 20,
      trendingScore: 75,
      buyLowScore: 20,
      volatilityRating: 30,
      minutesTrend: 1,
      usageTrend: 1,
      loyaltyWeeks: 0,
      reasonTags: ["test"],
      gameLogs: [
        { eventId: "a", eventName: "A vs B", eventShortName: "A/B", date: "2025-01-01", fantasyPoints: 50, stats: { minutes: 32 } },
        { eventId: "b", eventName: "C vs D", eventShortName: "C/D", date: "2025-01-02", fantasyPoints: 40, stats: { minutes: 31 } }
      ],
      priorWeeks: [
        { weekStart: "2024-12-04", averageFantasyPoints: 40 },
        { weekStart: "2024-12-11", averageFantasyPoints: 42 }
      ]
    }
  ],
  leaderboardBots: [{ id: "bot", displayName: "Bot", dailyValues: [10000, 10050, 10100] }]
};

test("builds a sim snapshot with active day and local portfolio", () => {
  const snapshot = buildSimSnapshot({
    fixture,
    state: {
      completedDays: 1,
      portfolio: createInitialPortfolio(10000)
    }
  });

  assert.equal(snapshot.sim.completedDays, 1);
  assert.equal(snapshot.sim.activeDay.label, "Tuesday");
  assert.equal(snapshot.stocks[0].actualFantasyPoints, 50);
  assert.equal(snapshot.stocks[0].gameLogs.length, 1);
  assert.equal(snapshot.stocks[0].scheduledGameLogs.length, 2);
  assert.ok(snapshot.stocks[0].priceHistory.length >= 3);
  assert.equal(snapshot.portfolio.totalValue, 10000);
  assert.equal(snapshot.leaderboard.length, 2);
});
