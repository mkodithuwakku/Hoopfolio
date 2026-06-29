export function getMarketLockStatus({ now, games, reopenHourLocal = 7 }) {
  const currentTime = new Date(now);
  const sortedGames = [...games]
    .map((game) => ({ ...game, startTime: new Date(game.startTime) }))
    .sort((a, b) => a.startTime - b.startTime);

  const todaysGames = sortedGames.filter((game) => isSameLocalDate(game.startTime, currentTime));
  const firstGameToday = todaysGames[0];

  if (firstGameToday && currentTime >= firstGameToday.startTime) {
    return {
      isOpen: false,
      reason: "Market locked before the first eligible NBA game of the day.",
      lockedAt: firstGameToday.startTime.toISOString(),
      nextOpenAt: nextMorning(currentTime, reopenHourLocal).toISOString()
    };
  }

  if (firstGameToday) {
    return {
      isOpen: true,
      reason: "Market open until the first eligible NBA game of the day.",
      locksAt: firstGameToday.startTime.toISOString(),
      nextOpenAt: null
    };
  }

  return {
    isOpen: true,
    reason: "No eligible NBA games today; market remains open.",
    locksAt: null,
    nextOpenAt: null
  };
}

export function assertMarketOpen(context) {
  const status = getMarketLockStatus(context);
  if (!status.isOpen) {
    const error = new Error(status.reason);
    error.code = "MARKET_LOCKED";
    error.marketStatus = status;
    throw error;
  }
  return status;
}

function isSameLocalDate(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function nextMorning(date, hour) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  next.setHours(hour, 0, 0, 0);
  return next;
}
