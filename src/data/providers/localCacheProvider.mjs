import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  applyPurchaseDiscount,
  calculateLoyaltyDiscount,
  calculateStockValue
} from "../../domain/pricing.mjs";
import { getMarketLockStatus } from "../../domain/marketLock.mjs";
import { getBuyLowCandidates, getTrendingStocks, searchStocks } from "../../domain/search.mjs";

const providerDir = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(providerDir, "..", "cache");

export async function loadMarketSnapshot(options = {}) {
  const [teams, players, games, weeklyMarket] = await Promise.all([
    readJson("teams.json"),
    readJson("players.json"),
    readJson("games-week-2026-01.json"),
    readJson("weekly-market-2026-01.json")
  ]);

  const teamById = new Map(teams.map((team) => [team.id, team]));
  const marketByPlayerId = new Map(weeklyMarket.players.map((row) => [row.playerId, row]));
  const stocks = players.map((player) => {
    const team = teamById.get(player.teamId);
    const market = marketByPlayerId.get(player.id);
    const stockValue = calculateStockValue(market);
    const loyaltyBoost = calculateLoyaltyDiscount(market.loyaltyWeeks ?? 0);
    const discountedPrice = applyPurchaseDiscount(
      stockValue.finalStockValue,
      loyaltyBoost.discountPercent
    );

    return {
      playerId: player.id,
      playerName: player.name,
      teamId: team.id,
      teamName: team.name,
      teamAbbreviation: team.abbreviation,
      position: player.position,
      injuryStatus: player.status,
      openingPrice: market.openingPrice,
      currentPrice: stockValue.finalStockValue,
      discountedBuyPrice: discountedPrice,
      projectedFinalValue: market.projectedFinalValue,
      projectedReturn: market.projectedReturn,
      currentReturn: stockValue.finalReturnPercent,
      projectedFantasyPoints: market.expectedFantasyPoints,
      actualFantasyPoints: market.actualFantasyPoints,
      gamesPlayedThisWeek: market.gamesPlayedThisWeek,
      gamesRemainingThisWeek: market.gamesRemainingThisWeek,
      ownershipPercent: market.ownershipPercent,
      trendingScore: market.trendingScore,
      buyLowScore: market.buyLowScore,
      volatilityRating: market.volatilityRating,
      minutesTrend: market.minutesTrend,
      usageTrend: market.usageTrend,
      reasonTags: market.reasonTags,
      loyaltyBoost,
      resultExplanation: stockValue.explanation
    };
  });

  return {
    dataMode: "local-cache",
    contest: weeklyMarket.contest,
    marketStatus: getMarketLockStatus({
      now: options.now ?? new Date().toISOString(),
      games
    }),
    teams,
    stocks,
    trending: getTrendingStocks(stocks),
    buyLow: getBuyLowCandidates(stocks)
  };
}

export async function searchLocalStocks(options = {}) {
  const snapshot = await loadMarketSnapshot(options);
  return {
    ...snapshot,
    stocks: searchStocks(snapshot.stocks, options)
  };
}

async function readJson(fileName) {
  return JSON.parse(await readFile(join(cacheDir, fileName), "utf8"));
}
