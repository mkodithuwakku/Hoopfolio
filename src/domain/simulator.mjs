import {
  applyPurchaseDiscount,
  calculateLoyaltyDiscount,
  calculateStockValue
} from "./pricing.mjs";
import { summarizePortfolio } from "./trading.mjs";
import { getBuyLowCandidates, getTrendingStocks } from "./search.mjs";

export function buildSimSnapshot({ fixture, state }) {
  const completedDays = state.completedDays;
  const teamById = new Map(fixture.teams.map((team) => [team.id, team]));
  const stocks = fixture.players.map((player) =>
    buildStockRow(player, completedDays, teamById.get(player.teamId), fixture.days)
  );
  const portfolioSummary = summarizePortfolio(state.portfolio, stocks, fixture.contest.startingCoins);
  const leaderboard = buildLeaderboard(fixture, portfolioSummary, completedDays);
  const activeDay = fixture.days[completedDays] ?? null;

  return {
    dataMode: "local-cache",
    source: fixture.source ?? null,
    fixtureNotice: fixture.notice,
    contest: fixture.contest,
    sim: {
      completedDays,
      totalDays: fixture.days.length,
      activeDay,
      isSettled: completedDays >= fixture.days.length,
      canTrade: completedDays < fixture.days.length,
      progressLabel:
        completedDays >= fixture.days.length
          ? "Week settled"
          : `Market open before ${activeDay.label}`
    },
    marketStatus: {
      isOpen: completedDays < fixture.days.length,
      reason:
        completedDays < fixture.days.length
          ? "Test simulator market is open. Advance day to lock, apply games, and reopen the next day."
          : "Test week is settled. Reset the simulator to replay.",
      locksAt: activeDay?.marketLocksAt ?? null,
      nextOpenAt: null
    },
    teams: fixture.teams,
    stocks,
    trending: getTrendingStocks(stocks),
    buyLow: getBuyLowCandidates(stocks),
    portfolio: portfolioSummary,
    leaderboard
  };
}

export function buildStockRow(player, completedDays, team = {}, days = []) {
  const actualFantasyPoints = sumFantasyThroughDay(player.dailyFantasyPoints, completedDays);
  const isSettled = completedDays >= player.dailyFantasyPoints.length;
  const projectedActual = actualFantasyPoints + sumFantasyFromDay(player.projectedRemainingFantasyPoints, completedDays);
  const fantasyPointsForCurrentPrice = isSettled ? actualFantasyPoints : projectedActual;
  const reliabilityCarryPercent = calculateReliabilityCarry(player);
  const accruedCarryPercent = reliabilityCarryPercent * carryProgress(completedDays, player.dailyFantasyPoints.length);
  const stockValue = calculateStockValue({
    openingPrice: player.openingPrice,
    expectedFantasyPoints: player.expectedFantasyPoints,
    actualFantasyPoints: fantasyPointsForCurrentPrice,
    carryPercent: accruedCarryPercent,
    volatilityMultiplier: player.volatilityMultiplier
  });
  const loyaltyBoost = calculateLoyaltyDiscount(player.loyaltyWeeks ?? 0);
  const discountedPrice = applyPurchaseDiscount(
    stockValue.finalStockValue,
    loyaltyBoost.discountPercent
  );
  const projectedValue = calculateStockValue({
    openingPrice: player.openingPrice,
    expectedFantasyPoints: player.expectedFantasyPoints,
    actualFantasyPoints: projectedActual,
    carryPercent: reliabilityCarryPercent,
    volatilityMultiplier: player.volatilityMultiplier
  });
  const visibleGameLogs = filterVisibleGameLogs(player.gameLogs ?? [], days, completedDays);

  return {
    playerId: player.id,
    playerName: player.name,
    teamId: player.teamId,
    teamName: player.teamName,
    teamAbbreviation: player.teamAbbreviation,
    teamColor: team.neutralColor ?? player.teamColor ?? "#49d6e8",
    teamLogoUrl: team.logoUrl ?? null,
    nbaPersonId: player.nbaPersonId ?? null,
    headshotUrl: player.headshotUrl ?? null,
    position: player.position,
    injuryStatus: player.status,
    openingPrice: player.openingPrice,
    currentPrice: stockValue.finalStockValue,
    discountedBuyPrice: discountedPrice,
    projectedFinalValue: projectedValue.finalStockValue,
    projectedReturn: projectedValue.finalReturnPercent,
    currentReturn: stockValue.finalReturnPercent,
    reliabilityCarryPercent,
    projectedFantasyPoints: player.expectedFantasyPoints,
    actualFantasyPoints,
    gamesPlayedThisWeek: countGamesThroughDay(player.dailyFantasyPoints, completedDays),
    gamesRemainingThisWeek: countGamesFromDay(player.dailyFantasyPoints, completedDays),
    recentAverageFantasyPoints: player.recentAverageFantasyPoints ?? null,
    priorWeeksIncluded: player.priorWeeksIncluded ?? player.priorWeeks?.length ?? 0,
    previousWeeksImpactPercent: player.previousWeeksImpactPercent ?? 0,
    priorFormScore: player.priorFormScore ?? 50,
    openingPriceBasis: player.openingPriceBasis ?? null,
    historicalVolatility: player.historicalVolatility ?? null,
    projectionBasis: player.projectionBasis ?? "current week projection",
    priorWeeks: player.priorWeeks ?? [],
    gameLogs: visibleGameLogs,
    scheduledGameLogs: (player.gameLogs ?? []).map(({ eventId, eventName, eventShortName, date }) => ({
      eventId,
      eventName,
      eventShortName,
      date
    })),
    priceHistory: buildPriceHistory({
      completedDays,
      currentPrice: stockValue.finalStockValue,
      player,
      projectedPrice: projectedValue.finalStockValue
    }),
    ownershipPercent: player.ownershipPercent,
    trendingScore: player.trendingScore,
    buyLowScore: player.buyLowScore,
    volatilityRating: player.volatilityRating,
    minutesTrend: player.minutesTrend,
    usageTrend: player.usageTrend,
    reasonTags: player.reasonTags,
    loyaltyBoost,
    resultExplanation: stockValue.explanation
  };
}

function filterVisibleGameLogs(gameLogs, days, completedDays) {
  const visibleDates = new Set(days.slice(0, completedDays).map((day) => day.date));
  return gameLogs.filter((log) => visibleDates.has(log.date));
}

function calculateReliabilityCarry(player) {
  const expected = player.expectedFantasyPoints ?? 0;
  const average = player.recentAverageFantasyPoints ?? 0;
  const volatility = player.historicalVolatility ?? 0;
  if (expected < 110 || average < 28) return 0;

  const volumeScore = clamp((expected - 110) / 120, 0, 1);
  const stabilityScore = clamp(1 - volatility / 48, 0, 1);
  return roundNumber((0.015 + 0.045 * volumeScore) * stabilityScore, 4);
}

function carryProgress(completedDays, totalDays) {
  if (completedDays <= 0) return 0;
  return clamp(completedDays / Math.max(totalDays, 1), 0, 1);
}

function buildPriceHistory({ completedDays, currentPrice, player, projectedPrice }) {
  const priorPoints = buildPriorPriceHistory(player);
  const points = [
    ...priorPoints,
    {
      label: "Week open",
      price: player.openingPrice,
      kind: "open"
    }
  ];

  for (let dayIndex = 1; dayIndex <= completedDays; dayIndex += 1) {
    const actualFantasyPoints = sumFantasyThroughDay(player.dailyFantasyPoints, dayIndex);
    const projectedActual = actualFantasyPoints + sumFantasyFromDay(player.projectedRemainingFantasyPoints, dayIndex);
    const reliabilityCarryPercent = calculateReliabilityCarry(player) * carryProgress(dayIndex, player.dailyFantasyPoints.length);
    const value = calculateStockValue({
      openingPrice: player.openingPrice,
      expectedFantasyPoints: player.expectedFantasyPoints,
      actualFantasyPoints: projectedActual,
      carryPercent: reliabilityCarryPercent,
      volatilityMultiplier: player.volatilityMultiplier
    });

    points.push({
      label: `Day ${dayIndex}`,
      price: value.finalStockValue,
      kind: "actual"
    });
  }

  points.push({
    label: completedDays > 0 ? "Now" : "Open",
    price: currentPrice,
    kind: "current"
  });

  if (projectedPrice !== currentPrice) {
    points.push({
      label: "Projected close",
      price: projectedPrice,
      kind: "projected"
    });
  }

  return points.filter((point, index, rows) => {
    if (index === 0) return true;
    const previous = rows[index - 1];
    return point.label !== previous.label || point.price !== previous.price || point.kind !== previous.kind;
  });
}

function buildPriorPriceHistory(player) {
  const priorWeeks = player.priorWeeks ?? [];
  const openingPrice = player.openingPrice ?? 100;
  if (!priorWeeks.length) {
    return [{ label: "4wk ago", price: roundNumber(openingPrice * 0.98), kind: "history" }];
  }

  let syntheticPrice = 100;
  return priorWeeks.map((week, index) => {
    const previousAverage = priorWeeks[index - 1]?.averageFantasyPoints ?? week.averageFantasyPoints;
    const momentum = (week.averageFantasyPoints - previousAverage) / Math.max(Math.abs(previousAverage), 12);
    syntheticPrice *= 1 + clamp(momentum * 0.16, -0.12, 0.12);
    const blend = (index + 1) / priorWeeks.length;
    const price = syntheticPrice * (1 - blend) + openingPrice * blend;
    return {
      label: `W-${priorWeeks.length - index}`,
      price: roundNumber(price, 2),
      kind: "history"
    };
  });
}

function buildLeaderboard(fixture, portfolioSummary, completedDays) {
  const botRows = fixture.leaderboardBots.map((bot) => {
    const value = bot.dailyValues[Math.min(completedDays, bot.dailyValues.length - 1)];
    return {
      userId: bot.id,
      displayName: bot.displayName,
      totalValue: value,
      netReturn: roundNumber((value - fixture.contest.startingCoins) / fixture.contest.startingCoins, 4),
      isCurrentUser: false
    };
  });

  const rows = [
    ...botRows,
    {
      userId: "local-user",
      displayName: "You",
      totalValue: portfolioSummary.totalValue,
      netReturn: portfolioSummary.netReturn,
      isCurrentUser: true
    }
  ].sort((a, b) => b.totalValue - a.totalValue);

  return rows.map((row, index) => ({
    rank: index + 1,
    ...row
  }));
}

function sumFantasyThroughDay(values, completedDays) {
  return roundNumber(values.slice(0, completedDays).reduce((sum, value) => sum + value, 0), 2);
}

function sumFantasyFromDay(values, completedDays) {
  return roundNumber(values.slice(completedDays).reduce((sum, value) => sum + value, 0), 2);
}

function countGamesThroughDay(values, completedDays) {
  return values.slice(0, completedDays).filter((value) => value > 0).length;
}

function countGamesFromDay(values, completedDays) {
  return values.slice(completedDays).filter((value) => value > 0).length;
}

function roundNumber(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
