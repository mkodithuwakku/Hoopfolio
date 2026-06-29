import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSimSnapshot } from "../../domain/simulator.mjs";
import { buyStock, createInitialPortfolio, sellStock } from "../../domain/trading.mjs";
import { searchStocks } from "../../domain/search.mjs";

const providerDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(providerDir, "..", "..", "..");
const cacheDir = join(providerDir, "..", "cache");
const stateDir = join(rootDir, ".cache");
const statePath = join(stateDir, "hoopfolio-test-state.json");
const fixturePath = join(
  cacheDir,
  "recorded",
  "2024-25",
  "midseason-week-2025-01-06.json"
);

export async function getTestMarketSnapshot() {
  const fixture = await loadFixture();
  const state = await loadState(fixture);
  return buildSimSnapshot({ fixture, state });
}

export async function searchTestMarket(options = {}) {
  const snapshot = await getTestMarketSnapshot();
  return {
    ...snapshot,
    stocks: searchStocks(snapshot.stocks, options)
  };
}

export async function resetTestMarket() {
  const fixture = await loadFixture();
  const state = createDefaultState(fixture);
  await saveState(state);
  return buildSimSnapshot({ fixture, state });
}

export async function advanceTestMarketDay() {
  const fixture = await loadFixture();
  const state = await loadState(fixture);
  state.completedDays = Math.min(state.completedDays + 1, fixture.days.length);
  state.updatedAt = new Date().toISOString();
  await saveState(state);
  return buildSimSnapshot({ fixture, state });
}

export async function buyTestStock({ playerId, amountCoins }) {
  const fixture = await loadFixture();
  const state = await loadState(fixture);
  const snapshot = buildSimSnapshot({ fixture, state });
  assertCanTrade(snapshot);
  const stock = snapshot.stocks.find((row) => row.playerId === playerId);
  if (!stock) throw providerError("PLAYER_NOT_FOUND", "Player is not available in this test market.");

  state.portfolio = buyStock({
    portfolio: state.portfolio,
    stock,
    amountCoins,
    now: new Date().toISOString()
  });
  state.updatedAt = new Date().toISOString();
  await saveState(state);
  return buildSimSnapshot({ fixture, state });
}

export async function sellTestStock({ playerId, shares = "all" }) {
  const fixture = await loadFixture();
  const state = await loadState(fixture);
  const snapshot = buildSimSnapshot({ fixture, state });
  assertCanTrade(snapshot);
  const stock = snapshot.stocks.find((row) => row.playerId === playerId);
  if (!stock) throw providerError("PLAYER_NOT_FOUND", "Player is not available in this test market.");

  state.portfolio = sellStock({
    portfolio: state.portfolio,
    stock,
    shares,
    now: new Date().toISOString()
  });
  state.updatedAt = new Date().toISOString();
  await saveState(state);
  return buildSimSnapshot({ fixture, state });
}

async function loadFixture() {
  return JSON.parse(await readFile(fixturePath, "utf8"));
}

async function loadState(fixture) {
  try {
    const state = JSON.parse(await readFile(statePath, "utf8"));
    if (state.fixtureId === fixture.id) return state;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const state = createDefaultState(fixture);
  await saveState(state);
  return state;
}

async function saveState(state) {
  await mkdir(stateDir, { recursive: true });
  await writeFile(statePath, JSON.stringify(state, null, 2));
}

function createDefaultState(fixture) {
  return {
    fixtureId: fixture.id,
    completedDays: 0,
    portfolio: createInitialPortfolio(fixture.contest.startingCoins),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function assertCanTrade(snapshot) {
  if (!snapshot.sim.canTrade) {
    throw providerError("MARKET_LOCKED", "The test week is settled. Reset to trade again.");
  }
}

function providerError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}
