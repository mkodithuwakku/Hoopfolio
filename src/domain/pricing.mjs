export const DEFAULT_PRICING_CONFIG = Object.freeze({
  minReturnCap: -0.4,
  maxReturnCap: 0.6,
  lowProjectionThreshold: 45,
  lowProjectionDampening: 0.45,
  minimumExpectedFantasyPoints: 12,
  defaultOpeningPrice: 100,
  loyaltyDiscountStep: 0.01,
  loyaltyDiscountCap: 0.05,
  loyaltyMinimumWeeks: 2
});

export function calculateFantasyPoints(stats) {
  return roundNumber(
    (stats.points ?? 0) +
      1.2 * (stats.rebounds ?? 0) +
      1.5 * (stats.assists ?? 0) +
      3 * (stats.steals ?? 0) +
      3 * (stats.blocks ?? 0) -
      (stats.turnovers ?? 0),
    2
  );
}

export function calculateExpectedWeeklyFantasyPoints(playerProjection) {
  const season = playerProjection.seasonAverageFantasyPoints ?? 0;
  const last10 = playerProjection.last10AverageFantasyPoints ?? season;
  const last5 = playerProjection.last5AverageFantasyPoints ?? last10;
  const games = playerProjection.gamesScheduledThisWeek ?? 0;
  const weightedAverage = 0.5 * season + 0.3 * last10 + 0.2 * last5;
  return roundNumber(weightedAverage * games, 2);
}

export function calculateStockValue(input, config = DEFAULT_PRICING_CONFIG) {
  const openingPrice = input.openingPrice ?? config.defaultOpeningPrice;
  const expectedFantasyPoints = Math.max(
    input.expectedFantasyPoints ?? calculateExpectedWeeklyFantasyPoints(input),
    config.minimumExpectedFantasyPoints
  );
  const actualFantasyPoints = input.actualFantasyPoints ?? 0;
  const volatilityMultiplier = input.volatilityMultiplier ?? 1;
  const performanceRatio = actualFantasyPoints / expectedFantasyPoints;
  let rawReturnPercent = (performanceRatio - 1) * volatilityMultiplier;

  const isLowProjection = expectedFantasyPoints < config.lowProjectionThreshold;
  if (isLowProjection && rawReturnPercent > 0) {
    rawReturnPercent *= config.lowProjectionDampening;
  }

  const finalReturnPercent = clamp(
    rawReturnPercent,
    config.minReturnCap,
    config.maxReturnCap
  );
  const finalStockValue = openingPrice * (1 + finalReturnPercent);

  return {
    openingPrice: roundNumber(openingPrice, 2),
    expectedFantasyPoints: roundNumber(expectedFantasyPoints, 2),
    actualFantasyPoints: roundNumber(actualFantasyPoints, 2),
    performanceRatio: roundNumber(performanceRatio, 4),
    rawReturnPercent: roundNumber(rawReturnPercent, 4),
    finalReturnPercent: roundNumber(finalReturnPercent, 4),
    finalStockValue: roundNumber(finalStockValue, 2),
    lowProjectionProtectionApplied: Boolean(isLowProjection && rawReturnPercent > 0),
    returnCapApplied:
      rawReturnPercent < config.minReturnCap || rawReturnPercent > config.maxReturnCap,
    explanation: buildStockExplanation({
      performanceRatio,
      finalReturnPercent,
      returnCapApplied:
        rawReturnPercent < config.minReturnCap || rawReturnPercent > config.maxReturnCap,
      lowProjectionProtectionApplied: Boolean(isLowProjection && rawReturnPercent > 0)
    })
  };
}

export function calculateLoyaltyDiscount(loyaltyWeeks, config = DEFAULT_PRICING_CONFIG) {
  if (loyaltyWeeks < config.loyaltyMinimumWeeks) {
    return {
      eligible: false,
      discountPercent: 0,
      explanation: "Loyalty discount unlocks after repeated weekly investments."
    };
  }

  const earnedSteps = loyaltyWeeks - config.loyaltyMinimumWeeks + 1;
  const discountPercent = Math.min(
    earnedSteps * config.loyaltyDiscountStep,
    config.loyaltyDiscountCap
  );

  return {
    eligible: true,
    discountPercent: roundNumber(discountPercent, 4),
    explanation: `${roundNumber(discountPercent * 100, 2)}% loyalty purchase discount applied.`
  };
}

export function applyPurchaseDiscount(price, discountPercent) {
  return roundNumber(price * (1 - discountPercent), 2);
}

function buildStockExplanation(details) {
  const outperformed = details.performanceRatio >= 1;
  const direction = outperformed ? "increased" : "decreased";
  const comparison = outperformed ? "exceeded" : "missed";
  const variance = Math.abs((details.performanceRatio - 1) * 100);
  const notes = [
    `Stock ${direction} because actual fantasy production ${comparison} expected production by ${roundNumber(variance, 1)}%.`
  ];

  if (details.lowProjectionProtectionApplied) {
    notes.push("Low-projection protection dampened upside for a small expected role.");
  }

  if (details.returnCapApplied) {
    notes.push("Weekly return cap limited the final movement.");
  }

  notes.push(`Final return is ${roundNumber(details.finalReturnPercent * 100, 1)}%.`);
  return notes.join(" ");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundNumber(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
