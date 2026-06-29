import assert from "node:assert/strict";
import { test } from "node:test";
import { assertMarketOpen, getMarketLockStatus } from "../src/domain/marketLock.mjs";

const games = [
  {
    id: "game-1",
    startTime: "2026-01-06T00:30:00.000Z"
  },
  {
    id: "game-2",
    startTime: "2026-01-06T02:00:00.000Z"
  }
];

test("market is open before the first game of the day", () => {
  const status = getMarketLockStatus({
    now: "2026-01-06T00:00:00.000Z",
    games
  });

  assert.equal(status.isOpen, true);
  assert.equal(status.locksAt, "2026-01-06T00:30:00.000Z");
});

test("market locks once the first game starts", () => {
  const status = getMarketLockStatus({
    now: "2026-01-06T00:30:00.000Z",
    games
  });

  assert.equal(status.isOpen, false);
});

test("assertMarketOpen throws after lock", () => {
  assert.throws(
    () =>
      assertMarketOpen({
        now: "2026-01-06T01:00:00.000Z",
        games
      }),
    /Market locked/
  );
});
