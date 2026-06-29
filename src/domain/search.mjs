export function searchStocks(stocks, options = {}) {
  const query = normalize(options.query ?? options.q ?? "");
  const filters = options.filters ?? {};
  const sort = options.sort ?? "projectedReturnDesc";

  const filtered = stocks.filter((stock) => {
    const haystack = normalize(
      [
        stock.playerName,
        stock.teamAbbreviation,
        stock.teamName,
        stock.position,
        stock.injuryStatus,
        ...(stock.reasonTags ?? [])
      ].join(" ")
    );

    if (query && !haystack.includes(query)) return false;
    if (filters.team && stock.teamAbbreviation !== filters.team) return false;
    if (filters.position && stock.position !== filters.position) return false;
    if (filters.boostEligible && !stock.loyaltyBoost?.eligible) return false;
    if (filters.buyLowOnly && stock.buyLowScore < 70) return false;
    if (filters.trendingOnly && Math.abs(stock.trendingScore) < 70) return false;
    if (filters.maxPrice != null && stock.currentPrice > filters.maxPrice) return false;
    if (filters.minProjectedReturn != null && stock.projectedReturn < filters.minProjectedReturn) {
      return false;
    }
    if (filters.gamesRemaining != null && stock.gamesRemainingThisWeek < filters.gamesRemaining) {
      return false;
    }

    return true;
  });

  return filtered.sort(sortComparators[sort] ?? sortComparators.projectedReturnDesc);
}

export function getTrendingStocks(stocks, limit = 5) {
  return [...stocks]
    .sort((a, b) => Math.abs(b.trendingScore) - Math.abs(a.trendingScore))
    .slice(0, limit);
}

export function getBuyLowCandidates(stocks, limit = 5) {
  return [...stocks].sort((a, b) => b.buyLowScore - a.buyLowScore).slice(0, limit);
}

const sortComparators = {
  projectedReturnDesc: (a, b) => b.projectedReturn - a.projectedReturn,
  currentPriceAsc: (a, b) => a.currentPrice - b.currentPrice,
  currentPriceDesc: (a, b) => b.currentPrice - a.currentPrice,
  ownershipDesc: (a, b) => b.ownershipPercent - a.ownershipPercent,
  buyLowDesc: (a, b) => b.buyLowScore - a.buyLowScore,
  trendingDesc: (a, b) => b.trendingScore - a.trendingScore,
  volatilityDesc: (a, b) => b.volatilityRating - a.volatilityRating
};

function normalize(value) {
  return String(value).trim().toLowerCase();
}
