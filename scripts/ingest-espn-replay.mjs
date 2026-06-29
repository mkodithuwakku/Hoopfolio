import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { calculateFantasyPoints } from "../src/domain/pricing.mjs";

const execFileAsync = promisify(execFile);

const args = parseArgs(process.argv.slice(2));
const season = args.season ?? "2024-25";
const weekStart = args["week-start"] ?? "2025-01-06";
const targetDays = Number(args.days ?? 7);
const priorWeeks = Number(args["prior-weeks"] ?? 4);
const maxPlayers = Number(args["max-players"] ?? 400);
const force = Boolean(args.force);

const rawRoot = join(process.cwd(), ".cache", "provider-raw", "espn", "nba", season);
const rawRootLabel = join(".cache", "provider-raw", "espn", "nba", season);
const outputPath = join(
  process.cwd(),
  "src",
  "data",
  "cache",
  "recorded",
  season,
  `espn-midseason-week-${weekStart}.json`
);

const requestDelayMs = 125;

const targetDates = dateRange(weekStart, targetDays);
const priorStart = addDays(weekStart, -7 * priorWeeks);
const priorDates = dateRange(priorStart, 7 * priorWeeks);
const allDates = [...priorDates, ...targetDates];

await mkdir(dirname(outputPath), { recursive: true });
await mkdir(rawRoot, { recursive: true });

const scoreboardsByDate = new Map();
for (const date of allDates) {
  const scoreboard = await readOrFetchJson({
    cachePath: join(rawRoot, "scoreboard", `${compactDate(date)}.json`),
    url: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${compactDate(date)}`,
    force
  });
  scoreboardsByDate.set(date, scoreboard);
  await delay(requestDelayMs);
}

const targetEvents = collectEvents(scoreboardsByDate, targetDates);
const targetSummaries = [];
for (const event of targetEvents) {
  const summary = await fetchSummary(event.id);
  if (summary) targetSummaries.push({ event, summary });
  await delay(requestDelayMs);
}

const targetPlayers = new Map();
for (const { event, summary } of targetSummaries) {
  for (const row of parseSummaryPlayers(summary, event)) {
    const player = ensurePlayer(targetPlayers, row);
    player.targetLogs.push(row);
    player.targetFantasy += row.fantasyPoints;
  }
}

const selectedPlayers = [...targetPlayers.values()]
  .filter((player) => player.targetLogs.length > 0)
  .sort((a, b) => b.targetFantasy - a.targetFantasy)
  .slice(0, maxPlayers);

const relevantTeamIds = new Set(selectedPlayers.map((player) => player.teamId));
const selectedPlayerIds = new Set(selectedPlayers.map((player) => player.id));
const priorEvents = collectEvents(scoreboardsByDate, priorDates).filter((event) =>
  event.teamIds.some((teamId) => relevantTeamIds.has(teamId))
);

const priorLogsByPlayerId = new Map();
for (const event of priorEvents) {
  const summary = await fetchSummary(event.id);
  if (!summary) continue;
  for (const row of parseSummaryPlayers(summary, event)) {
    if (!selectedPlayerIds.has(row.id)) continue;
    const logs = priorLogsByPlayerId.get(row.id) ?? [];
    logs.push(row);
    priorLogsByPlayerId.set(row.id, logs);
  }
  await delay(requestDelayMs);
}

const teams = buildTeams(selectedPlayers);
const days = targetDates.map((date) => ({
  label: weekdayLabel(date),
  date,
  marketLocksAt: `${date}T23:30:00.000Z`,
  games: targetEvents
    .filter((event) => event.date === date)
    .map((event) => ({
      eventId: event.id,
      name: event.name,
      shortName: event.shortName,
      status: event.status,
      homeTeam: event.homeTeam,
      awayTeam: event.awayTeam,
      homeScore: event.homeScore,
      awayScore: event.awayScore
    }))
}));

const players = selectedPlayers.map((player, index) =>
  buildFixturePlayer({
    player,
    targetDates,
    priorStart,
    priorWeeks,
    priorLogs: priorLogsByPlayerId.get(player.id) ?? [],
    index
  })
);

const fixture = {
  id: `espn-${season}-midseason-week-${weekStart}`,
  notice:
    "Real ESPN NBA scoreboard and boxscore replay fixture cached locally. Normal app/test runs read this file and make zero live provider calls.",
  source: {
    provider: "espn-site-api",
    sport: "nba",
    season,
    replayWeekStart: weekStart,
    replayWeekEnd: targetDates.at(-1),
    priorWeeksIncluded: priorWeeks,
    realGameData: true,
    liveProviderCalls: false,
    rawCacheDirectory: rawRootLabel,
    generatedAt: new Date().toISOString(),
    refreshCommand: `npm run ingest:espn-replay -- --season=${season} --week-start=${weekStart}`
  },
  contest: {
    id: `espn-${season}-midseason-week-${weekStart}`,
    name: `${season} ESPN Real Data Replay`,
    seasonLabel: `${season} ESPN cached replay`,
    startingCoins: 10000,
    startsAt: `${weekStart}T17:00:00.000Z`,
    endsAt: `${targetDates.at(-1)}T23:59:59.000Z`
  },
  teams,
  days,
  players,
  leaderboardBots: [
    { id: "bot-value", displayName: "Value Hunter", dailyValues: [10000, 10120, 10270, 10410, 10520, 10680, 10810, 10920] },
    { id: "bot-stars", displayName: "Stars Only", dailyValues: [10000, 9940, 10080, 10220, 10160, 10420, 10510, 10600] },
    { id: "bot-contrarian", displayName: "Low Own Lab", dailyValues: [10000, 10030, 9860, 10190, 10480, 10340, 10690, 10870] },
    { id: "bot-tilt", displayName: "Panic Seller", dailyValues: [10000, 9810, 9640, 9890, 9720, 10020, 9840, 9950] }
  ]
};

await writeFile(outputPath, `${JSON.stringify(fixture, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      ok: true,
      provider: fixture.source.provider,
      outputPath,
      rawRoot,
      targetGames: targetEvents.length,
      priorGamesScanned: priorEvents.length,
      playerCount: players.length,
      samplePlayers: players.slice(0, 25).map((player) => ({
        id: player.id,
        name: player.name,
        team: player.teamAbbreviation,
        targetWeekFantasy: player.dailyFantasyPoints.reduce((sum, value) => sum + value, 0),
        expectedFantasyPoints: player.expectedFantasyPoints
      })),
      lowestVolumePlayer: players.at(-1)
        ? {
            id: players.at(-1).id,
            name: players.at(-1).name,
            team: players.at(-1).teamAbbreviation,
            targetWeekFantasy: players.at(-1).dailyFantasyPoints.reduce((sum, value) => sum + value, 0),
            expectedFantasyPoints: players.at(-1).expectedFantasyPoints
          }
        : null
    },
    null,
    2
  )
);

async function fetchSummary(eventId) {
  const missingPath = join(rawRoot, "summary", `${eventId}.missing.json`);
  if (!force) {
    try {
      await readFile(missingPath, "utf8");
      return null;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  try {
    return await readOrFetchJson({
      cachePath: join(rawRoot, "summary", `${eventId}.json`),
      url: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=${eventId}`,
      force
    });
  } catch (error) {
    console.warn(`Skipping ESPN event ${eventId}: ${error.message}`);
    await mkdir(dirname(missingPath), { recursive: true });
    await writeFile(
      missingPath,
      `${JSON.stringify({ eventId, skippedAt: new Date().toISOString(), reason: error.message }, null, 2)}\n`
    );
    return null;
  }
}

async function readOrFetchJson({ cachePath, url, force: shouldForce }) {
  if (!shouldForce) {
    try {
      return JSON.parse(await readFile(cachePath, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }

  const json = await fetchJson(url);
  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(json)}\n`);
  return json;
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json, text/plain, */*",
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  } catch (fetchError) {
    const { stdout } = await execFileAsync("curl", [
      "-s",
      "--fail",
      "--max-time",
      "30",
      "-A",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      url
    ]);
    try {
      return JSON.parse(stdout);
    } catch (parseError) {
      parseError.message = `Could not parse provider response for ${url}: ${parseError.message}`;
      parseError.cause = fetchError;
      throw parseError;
    }
  }
}

function collectEvents(scoreboardsByDateMap, dates) {
  return dates.flatMap((date) => {
    const scoreboard = scoreboardsByDateMap.get(date);
    return (scoreboard?.events ?? [])
      .filter((event) => event.status?.type?.completed)
      .map((event) => {
        const competition = event.competitions?.[0] ?? {};
        const competitors = competition.competitors ?? [];
        const home = competitors.find((competitor) => competitor.homeAway === "home");
        const away = competitors.find((competitor) => competitor.homeAway === "away");
        const teamIds = competitors.map((competitor) => competitor.team?.id).filter(Boolean);
        return {
          id: event.id,
          date,
          name: event.name,
          shortName: event.shortName,
          status: event.status?.type?.shortDetail ?? event.status?.type?.description ?? "Final",
          homeTeam: normalizeCompetitionTeam(home),
          awayTeam: normalizeCompetitionTeam(away),
          homeScore: Number(home?.score ?? 0),
          awayScore: Number(away?.score ?? 0),
          teamIds
        };
      });
  });
}

function normalizeCompetitionTeam(competitor) {
  const team = competitor?.team ?? {};
  return {
    id: team.id,
    name: team.location,
    displayName: team.displayName,
    abbreviation: team.abbreviation,
    color: team.color ? `#${team.color}` : "#49d6e8",
    logoUrl: team.logo ?? null
  };
}

function parseSummaryPlayers(summary, event) {
  const rows = [];
  for (const teamBlock of summary.boxscore?.players ?? []) {
    const team = teamBlock.team;
    for (const statBlock of teamBlock.statistics ?? []) {
      const keys = statBlock.keys ?? [];
      for (const athleteRow of statBlock.athletes ?? []) {
        if (athleteRow.didNotPlay || !athleteRow.athlete) continue;
        const stats = mapStats(keys, athleteRow.stats ?? []);
        if ((stats.minutes ?? 0) <= 0) continue;
        rows.push({
          id: athleteRow.athlete.id,
          name: athleteRow.athlete.displayName,
          headshotUrl: athleteRow.athlete.headshot?.href ?? null,
          position: athleteRow.athlete.position?.abbreviation ?? "G/F",
          teamId: team.id,
          teamName: team.location,
          teamDisplayName: team.displayName,
          teamAbbreviation: team.abbreviation,
          teamColor: team.color ? `#${team.color}` : "#49d6e8",
          teamLogoUrl: team.logo ?? null,
          eventId: event.id,
          eventName: event.name,
          eventShortName: event.shortName,
          date: event.date,
          fantasyPoints: calculateFantasyPoints(stats),
          stats
        });
      }
    }
  }
  return rows;
}

function mapStats(keys, values) {
  const stats = {};
  keys.forEach((key, index) => {
    const value = values[index];
    if (key === "minutes") {
      stats.minutes = parseMinutes(value);
      return;
    }
    if (key.includes("-")) return;
    stats[key] = Number(value) || 0;
  });
  return {
    minutes: stats.minutes ?? 0,
    points: stats.points ?? 0,
    rebounds: stats.rebounds ?? 0,
    assists: stats.assists ?? 0,
    turnovers: stats.turnovers ?? 0,
    steals: stats.steals ?? 0,
    blocks: stats.blocks ?? 0
  };
}

function ensurePlayer(playersById, row) {
  if (!playersById.has(row.id)) {
    playersById.set(row.id, {
      id: row.id,
      name: row.name,
      headshotUrl: row.headshotUrl,
      position: row.position,
      teamId: row.teamId,
      teamName: row.teamName,
      teamDisplayName: row.teamDisplayName,
      teamAbbreviation: row.teamAbbreviation,
      teamColor: row.teamColor,
      teamLogoUrl: row.teamLogoUrl,
      targetFantasy: 0,
      targetLogs: []
    });
  }
  return playersById.get(row.id);
}

function buildTeams(players) {
  const teamsById = new Map();
  for (const player of players) {
    teamsById.set(player.teamId, {
      id: player.teamId,
      espnTeamId: player.teamId,
      name: player.teamName,
      displayName: player.teamDisplayName,
      abbreviation: player.teamAbbreviation,
      neutralColor: player.teamColor,
      logoUrl: player.teamLogoUrl
    });
  }
  return [...teamsById.values()].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
}

function buildFixturePlayer({ player, targetDates: dates, priorStart: firstPriorDate, priorWeeks: weekCount, priorLogs, index }) {
  const logsByDate = groupBy(player.targetLogs, (log) => log.date);
  const dailyFantasyPoints = dates.map((date) =>
    roundNumber((logsByDate.get(date) ?? []).reduce((sum, log) => sum + log.fantasyPoints, 0))
  );
  const gamesScheduled = dailyFantasyPoints.filter((value) => value > 0).length;
  const priorWeekRows = Array.from({ length: weekCount }, (_, weekIndex) => {
    const weekStart = addDays(firstPriorDate, weekIndex * 7);
    const weekEnd = addDays(weekStart, 6);
    const logs = priorLogs.filter((log) => log.date >= weekStart && log.date <= weekEnd);
    const totalFantasyPoints = roundNumber(logs.reduce((sum, log) => sum + log.fantasyPoints, 0));
    return {
      weekStart,
      games: logs.length,
      averageFantasyPoints: logs.length ? roundNumber(totalFantasyPoints / logs.length, 1) : 0,
      totalFantasyPoints
    };
  });
  const nonZeroPriorWeeks = priorWeekRows.filter((week) => week.games > 0);
  const recentAverageFantasyPoints = nonZeroPriorWeeks.length
    ? roundNumber(
        nonZeroPriorWeeks.reduce((sum, week) => sum + week.averageFantasyPoints, 0) /
          nonZeroPriorWeeks.length,
        1
      )
    : roundNumber(player.targetFantasy / Math.max(gamesScheduled, 1), 1);
  const expectedFantasyPoints = roundNumber(recentAverageFantasyPoints * Math.max(gamesScheduled, 1));
  const projectedRemainingFantasyPoints = dailyFantasyPoints.map((value) =>
    value > 0 ? recentAverageFantasyPoints : 0
  );
  const priorAverages = nonZeroPriorWeeks.map((week) => week.averageFantasyPoints);
  const historicalVolatility = priorAverages.length
    ? roundNumber(Math.max(...priorAverages) - Math.min(...priorAverages), 1)
    : 0;
  const firstAverage = priorAverages[0] ?? recentAverageFantasyPoints;
  const lastAverage = priorAverages.at(-1) ?? recentAverageFantasyPoints;
  const momentum = roundNumber(lastAverage - firstAverage, 1);
  const targetAverage = roundNumber(player.targetFantasy / Math.max(gamesScheduled, 1), 1);

  return {
    id: slugify(`${player.name}-${player.id}`),
    espnAthleteId: player.id,
    headshotUrl: player.headshotUrl,
    name: player.name,
    teamId: player.teamId,
    teamName: player.teamName,
    teamAbbreviation: player.teamAbbreviation,
    position: player.position,
    status: "Active",
    openingPrice: 100,
    expectedFantasyPoints,
    dailyFantasyPoints,
    gameLogs: player.targetLogs
      .map((log) => ({
        eventId: log.eventId,
        eventName: log.eventName,
        eventShortName: log.eventShortName,
        date: log.date,
        fantasyPoints: log.fantasyPoints,
        stats: log.stats
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    projectedRemainingFantasyPoints,
    volatilityMultiplier: clamp(0.78 + historicalVolatility / 80, 0.72, 1.08),
    ownershipPercent: clamp(Math.round(22 + targetAverage / 2 + index * 1.7), 12, 58),
    trendingScore: clamp(Math.round(50 + momentum * 5 + (targetAverage - recentAverageFantasyPoints) * 2), -90, 95),
    buyLowScore: clamp(Math.round(50 + (recentAverageFantasyPoints - targetAverage) * 3 + historicalVolatility), 20, 92),
    volatilityRating: clamp(Math.round(25 + historicalVolatility * 4), 20, 88),
    minutesTrend: roundNumber(average(player.targetLogs.map((log) => log.stats.minutes)) - average(priorLogs.map((log) => log.stats.minutes))),
    usageTrend: roundNumber(targetAverage - recentAverageFantasyPoints, 1),
    loyaltyWeeks: index % 6,
    priorWeeks: priorWeekRows,
    recentAverageFantasyPoints,
    priorWeeksIncluded: nonZeroPriorWeeks.length,
    historicalVolatility,
    projectionBasis: `${nonZeroPriorWeeks.length || weekCount}-week real ESPN boxscore cache, momentum ${momentum >= 0 ? "+" : ""}${momentum} FP`,
    reasonTags: buildReasonTags({
      gamesScheduled,
      momentum,
      targetAverage,
      recentAverageFantasyPoints,
      historicalVolatility
    })
  };
}

function buildReasonTags({ gamesScheduled, momentum, targetAverage, recentAverageFantasyPoints, historicalVolatility }) {
  const tags = ["real boxscore", `${gamesScheduled} games`];
  if (momentum >= 4) tags.push("prior trend up");
  if (targetAverage > recentAverageFantasyPoints + 5) tags.push("hot week");
  if (targetAverage < recentAverageFantasyPoints - 5) tags.push("buy low");
  if (historicalVolatility >= 8) tags.push("high volatility");
  if (historicalVolatility <= 4) tags.push("steady role");
  return tags.slice(0, 4);
}

function groupBy(rows, getKey) {
  const grouped = new Map();
  for (const row of rows) {
    const key = getKey(row);
    const bucket = grouped.get(key) ?? [];
    bucket.push(row);
    grouped.set(key, bucket);
  }
  return grouped;
}

function parseMinutes(value) {
  if (typeof value !== "string") return Number(value) || 0;
  const [minutes, seconds = "0"] = value.split(":");
  return roundNumber((Number(minutes) || 0) + (Number(seconds) || 0) / 60, 2);
}

function dateRange(startDate, count) {
  return Array.from({ length: count }, (_, index) => addDays(startDate, index));
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function compactDate(dateString) {
  return dateString.replaceAll("-", "");
}

function weekdayLabel(dateString) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC"
  }).format(new Date(`${dateString}T00:00:00.000Z`));
}

function average(values) {
  const numeric = values.filter((value) => Number.isFinite(value));
  if (!numeric.length) return 0;
  return numeric.reduce((sum, value) => sum + value, 0) / numeric.length;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function roundNumber(value, places = 2) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function parseArgs(argv) {
  const parsed = {};
  for (const rawArg of argv) {
    if (!rawArg.startsWith("--")) continue;
    const [key, value] = rawArg.slice(2).split("=");
    parsed[key] = value ?? true;
  }
  return parsed;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
