import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyPurchaseDiscount,
  calculateExpectedWeeklyFantasyPoints,
  calculateFantasyPoints,
  calculateLoyaltyDiscount,
  calculateStockValue
} from "../src/domain/pricing.mjs";

test("calculates fantasy points with Hoopfolio scoring", () => {
  assert.equal(
    calculateFantasyPoints({
      points: 30,
      rebounds: 10,
      assists: 8,
      steals: 2,
      blocks: 1,
      turnovers: 4
    }),
    59
  );
});

test("calculates weighted expected weekly fantasy points", () => {
  assert.equal(
    calculateExpectedWeeklyFantasyPoints({
      seasonAverageFantasyPoints: 42,
      last10AverageFantasyPoints: 45,
      last5AverageFantasyPoints: 48,
      gamesScheduledThisWeek: 3
    }),
    132.3
  );
});

test("caps oversized positive returns", () => {
  const result = calculateStockValue({
    openingPrice: 100,
    expectedFantasyPoints: 100,
    actualFantasyPoints: 220,
    volatilityMultiplier: 1
  });

  assert.equal(result.finalReturnPercent, 0.6);
  assert.equal(result.finalStockValue, 160);
  assert.equal(result.returnCapApplied, true);
});

test("dampens upside for tiny projection players", () => {
  const result = calculateStockValue({
    openingPrice: 100,
    expectedFantasyPoints: 20,
    actualFantasyPoints: 40,
    volatilityMultiplier: 1
  });

  assert.equal(result.lowProjectionProtectionApplied, true);
  assert.equal(result.finalReturnPercent, 0.45);
});

test("adds reliability carry to stock value", () => {
  const result = calculateStockValue({
    openingPrice: 100,
    expectedFantasyPoints: 140,
    actualFantasyPoints: 140,
    carryPercent: 0.035,
    volatilityMultiplier: 1
  });

  assert.equal(result.finalReturnPercent, 0.035);
  assert.equal(result.finalStockValue, 103.5);
});

test("calculates capped loyalty discount and purchase price", () => {
  const discount = calculateLoyaltyDiscount(7);

  assert.equal(discount.eligible, true);
  assert.equal(discount.discountPercent, 0.05);
  assert.equal(applyPurchaseDiscount(120, discount.discountPercent), 114);
});
