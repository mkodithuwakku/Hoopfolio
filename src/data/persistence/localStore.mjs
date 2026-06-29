import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const stateDir = join(process.cwd(), ".cache");
const appStatePath = join(stateDir, "hoopfolio-app-state.json");

const defaultState = {
  users: [
    {
      id: "local-user",
      email: "local@hoopfolio.test",
      name: "Local User",
      provider: "local",
      createdAt: "2026-01-01T00:00:00.000Z"
    }
  ],
  sessions: [],
  contests: [],
  portfolios: {},
  transactions: [],
  historicalPortfolioSnapshots: []
};

export async function loadAppState() {
  try {
    return JSON.parse(await readFile(appStatePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    await saveAppState(defaultState);
    return structuredClone(defaultState);
  }
}

export async function saveAppState(state) {
  await mkdir(stateDir, { recursive: true });
  await writeFile(appStatePath, JSON.stringify(state, null, 2));
}

export async function getCurrentUser() {
  const state = await loadAppState();
  return state.users[0];
}

export async function createGoogleDemoSession() {
  const state = await loadAppState();
  const user =
    state.users.find((entry) => entry.provider === "google-demo") ??
    {
      id: "google-demo-user",
      email: "google.user@example.com",
      name: "Google Demo User",
      provider: "google-demo",
      createdAt: new Date().toISOString()
    };

  if (!state.users.some((entry) => entry.id === user.id)) {
    state.users.push(user);
  }

  const session = {
    id: `session-${Date.now()}`,
    userId: user.id,
    provider: "google-demo",
    createdAt: new Date().toISOString()
  };
  state.sessions.push(session);
  await saveAppState(state);

  return { user, session };
}
