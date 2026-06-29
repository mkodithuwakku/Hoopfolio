import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buyStock,
  createInitialPortfolio,
  sellStock,
  summarizePortfolio
} from "../src/domain/trading.mjs";

const stock = {
  playerId: "shai-gilgeous-alexander",
  playerName: "Shai Gilgeous-Alexander",
  teamAbbreviation: "OKC",
  currentPrice: 100,
  discountedBuyPrice: 98
};

test("buys stock using discounted price and server timestamp", () => {
  const portfolio = buyStock({
    portfolio: createInitialPortfolio(10000),
    stock,
    amountCoins: 980,
    now: "2026-01-01T00:00:00.000Z"
  });

  assert.equal(portfolio.cash, 9020);
  assert.equal(portfolio.holdings[stock.playerId].shares, 10);
  assert.equal(portfolio.transactions[0].type, "BUY");
});

test("rejects overspend attempts", () => {
  assert.throws(
    () =>
      buyStock({
        portfolio: createInitialPortfolio(100),
        stock,
        amountCoins: 125,
        now: "2026-01-01T00:00:00.000Z"
      }),
    /Not enough coins/
  );
});

test("sells an entire holding and updates cash", () => {
  const bought = buyStock({
    portfolio: createInitialPortfolio(10000),
    stock,
    amountCoins: 980,
    now: "2026-01-01T00:00:00.000Z"
  });
  const sold = sellStock({
    portfolio: bought,
    stock: { ...stock, currentPrice: 105 },
    shares: "all",
    now: "2026-01-02T00:00:00.000Z"
  });

  assert.equal(sold.cash, 10070);
  assert.equal(sold.holdings[stock.playerId], undefined);
  assert.equal(sold.transactions[1].type, "SELL");
});

test("summarizes current portfolio value", () => {
  const portfolio = buyStock({
    portfolio: createInitialPortfolio(10000),
    stock,
    amountCoins: 980,
    now: "2026-01-01T00:00:00.000Z"
  });
  const summary = summarizePortfolio(portfolio, [{ ...stock, currentPrice: 108 }], 10000);

  assert.equal(summary.totalValue, 10100);
  assert.equal(summary.netReturn, 0.01);
});
