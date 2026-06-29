export const DEFAULT_TRADING_CONFIG = Object.freeze({
  startingCoins: 10000,
  minTradeCoins: 25,
  maxAllocationPercentPerPlayer: 0.45
});

export function createInitialPortfolio(startingCoins = DEFAULT_TRADING_CONFIG.startingCoins) {
  return {
    cash: startingCoins,
    holdings: {},
    transactions: []
  };
}

export function buyStock({ portfolio, stock, amountCoins, now, config = DEFAULT_TRADING_CONFIG }) {
  const amount = roundNumber(Number(amountCoins), 2);
  validateTradeAmount(amount, portfolio.cash, config);

  const price = stock.discountedBuyPrice ?? stock.currentPrice;
  if (price <= 0) throw tradeError("INVALID_PRICE", "Stock price must be greater than zero.");

  const shares = roundNumber(amount / price, 6);
  const existing = portfolio.holdings[stock.playerId] ?? {
    playerId: stock.playerId,
    shares: 0,
    averageEntryPrice: 0,
    investedCoins: 0
  };

  const nextInvested = roundNumber(existing.investedCoins + amount, 2);
  const nextShares = roundNumber(existing.shares + shares, 6);
  const nextAverageEntryPrice = roundNumber(nextInvested / nextShares, 4);

  const nextPortfolio = clonePortfolio(portfolio);
  nextPortfolio.cash = roundNumber(nextPortfolio.cash - amount, 2);
  nextPortfolio.holdings[stock.playerId] = {
    playerId: stock.playerId,
    shares: nextShares,
    averageEntryPrice: nextAverageEntryPrice,
    investedCoins: nextInvested
  };
  nextPortfolio.transactions.push({
    id: cryptoId("buy", now, stock.playerId, nextPortfolio.transactions.length),
    type: "BUY",
    playerId: stock.playerId,
    playerName: stock.playerName,
    shares,
    price,
    coins: amount,
    createdAt: now
  });

  return nextPortfolio;
}

export function sellStock({ portfolio, stock, shares, now }) {
  const existing = portfolio.holdings[stock.playerId];
  if (!existing || existing.shares <= 0) {
    throw tradeError("NO_POSITION", "No shares are available to sell.");
  }

  const sharesToSell = shares === "all" ? existing.shares : roundNumber(Number(shares), 6);
  if (!Number.isFinite(sharesToSell) || sharesToSell <= 0) {
    throw tradeError("INVALID_SHARES", "Sell shares must be greater than zero.");
  }
  if (sharesToSell > existing.shares) {
    throw tradeError("INSUFFICIENT_SHARES", "Cannot sell more shares than currently held.");
  }

  const proceeds = roundNumber(sharesToSell * stock.currentPrice, 2);
  const remainingShares = roundNumber(existing.shares - sharesToSell, 6);
  const nextPortfolio = clonePortfolio(portfolio);
  nextPortfolio.cash = roundNumber(nextPortfolio.cash + proceeds, 2);

  if (remainingShares <= 0.000001) {
    delete nextPortfolio.holdings[stock.playerId];
  } else {
    nextPortfolio.holdings[stock.playerId] = {
      ...existing,
      shares: remainingShares,
      investedCoins: roundNumber(existing.averageEntryPrice * remainingShares, 2)
    };
  }

  nextPortfolio.transactions.push({
    id: cryptoId("sell", now, stock.playerId, nextPortfolio.transactions.length),
    type: "SELL",
    playerId: stock.playerId,
    playerName: stock.playerName,
    shares: sharesToSell,
    price: stock.currentPrice,
    coins: proceeds,
    createdAt: now
  });

  return nextPortfolio;
}

export function summarizePortfolio(portfolio, stocks, startingCoins = DEFAULT_TRADING_CONFIG.startingCoins) {
  const stockById = new Map(stocks.map((stock) => [stock.playerId, stock]));
  const holdings = Object.values(portfolio.holdings).map((holding) => {
    const stock = stockById.get(holding.playerId);
    const currentValue = stock ? roundNumber(holding.shares * stock.currentPrice, 2) : 0;
    const unrealizedGain = roundNumber(currentValue - holding.investedCoins, 2);
    const unrealizedReturn = holding.investedCoins
      ? roundNumber(unrealizedGain / holding.investedCoins, 4)
      : 0;

    return {
      ...holding,
      playerName: stock?.playerName ?? holding.playerId,
      teamAbbreviation: stock?.teamAbbreviation ?? "",
      teamColor: stock?.teamColor ?? "#49d6e8",
      teamLogoUrl: stock?.teamLogoUrl ?? null,
      headshotUrl: stock?.headshotUrl ?? null,
      currentPrice: stock?.currentPrice ?? 0,
      currentValue,
      unrealizedGain,
      unrealizedReturn
    };
  });

  const investedValue = roundNumber(
    holdings.reduce((sum, holding) => sum + holding.currentValue, 0),
    2
  );
  const totalValue = roundNumber(portfolio.cash + investedValue, 2);

  return {
    startingCoins,
    cash: roundNumber(portfolio.cash, 2),
    investedValue,
    totalValue,
    netGain: roundNumber(totalValue - startingCoins, 2),
    netReturn: roundNumber((totalValue - startingCoins) / startingCoins, 4),
    holdings,
    transactions: [...portfolio.transactions].reverse()
  };
}

function validateTradeAmount(amount, cash, config) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw tradeError("INVALID_AMOUNT", "Trade amount must be greater than zero.");
  }
  if (amount < config.minTradeCoins) {
    throw tradeError("MIN_TRADE", `Minimum trade size is ${config.minTradeCoins} coins.`);
  }
  if (amount > cash) {
    throw tradeError("INSUFFICIENT_COINS", "Not enough coins for this trade.");
  }
}

function clonePortfolio(portfolio) {
  return {
    cash: portfolio.cash,
    holdings: structuredClone(portfolio.holdings),
    transactions: structuredClone(portfolio.transactions)
  };
}

function cryptoId(prefix, now, playerId, index) {
  return `${prefix}-${playerId}-${Date.parse(now)}-${index}`;
}

function tradeError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function roundNumber(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
