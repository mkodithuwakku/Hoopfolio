import assert from "node:assert/strict";
import { test } from "node:test";
import { searchStocks } from "../src/domain/search.mjs";

const stocks = [
  {
    playerName: "Jalen Brunson",
    teamAbbreviation: "NYK",
    teamName: "New York",
    position: "G",
    injuryStatus: "Active",
    currentPrice: 94,
    projectedReturn: 0.08,
    ownershipPercent: 25,
    buyLowScore: 88,
    trendingScore: -61,
    volatilityRating: 49,
    gamesRemainingThisWeek: 3,
    reasonTags: ["buy low", "usage up"],
    loyaltyBoost: { eligible: false }
  },
  {
    playerName: "Victor Wembanyama",
    teamAbbreviation: "SAS",
    teamName: "San Antonio",
    position: "C",
    injuryStatus: "Probable",
    currentPrice: 110,
    projectedReturn: 0.17,
    ownershipPercent: 45,
    buyLowScore: 66,
    trendingScore: 91,
    volatilityRating: 70,
    gamesRemainingThisWeek: 2,
    reasonTags: ["market mover", "boost eligible"],
    loyaltyBoost: { eligible: true }
  }
];

test("searches by player and tag text", () => {
  assert.equal(searchStocks(stocks, { query: "usage" }).length, 1);
  assert.equal(searchStocks(stocks, { query: "wemby" }).length, 0);
  assert.equal(searchStocks(stocks, { query: "victor" })[0].teamAbbreviation, "SAS");
});

test("filters buy-low candidates", () => {
  const result = searchStocks(stocks, { filters: { buyLowOnly: true } });
  assert.equal(result.length, 1);
  assert.equal(result[0].playerName, "Jalen Brunson");
});

test("sorts by projected return", () => {
  const result = searchStocks(stocks, { sort: "projectedReturnDesc" });
  assert.equal(result[0].playerName, "Victor Wembanyama");
});
