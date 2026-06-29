import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const fixturePath = new URL(
  "../src/data/cache/recorded/2024-25/espn-midseason-week-2025-01-06.json",
  import.meta.url
);

test("current replay fixture is generated from real cached provider data", async () => {
  const fixture = JSON.parse(await readFile(fixturePath, "utf8"));

  assert.equal(fixture.source.provider, "espn-site-api");
  assert.equal(fixture.source.realGameData, true);
  assert.equal(fixture.source.liveProviderCalls, false);
  assert.match(fixture.source.rawCacheDirectory, /^\.cache\/provider-raw\/espn\/nba\//);
  assert.equal(fixture.days.length, 7);
  assert.ok(fixture.players.length >= 150);
  assert.equal(new Set(fixture.players.map((player) => player.teamAbbreviation)).size, 30);
  assert.ok(
    fixture.players.some((player) => player.openingPrice !== 100),
    "prior-week form should move at least some opening prices away from 100"
  );
  assert.ok(fixture.days[0].games.length > 0);
  assert.ok(fixture.days[0].games[0].eventId);
  assert.ok(fixture.days[0].games[0].homeTeam);

  for (const player of fixture.players) {
    assert.ok(player.espnAthleteId, `${player.name} should keep source athlete id`);
    assert.ok(player.dailyFantasyPoints.some((value) => Number.isFinite(value)), `${player.name} should have real replay output`);
    assert.ok(player.expectedFantasyPoints >= 0, `${player.name} should have a non-negative projection`);
    assert.ok(player.gameLogs.length > 0, `${player.name} should include game logs`);
    assert.ok(player.priorWeeks.length >= 4, `${player.name} should include prior-week context`);
    assert.ok(Number.isFinite(player.previousWeeksImpactPercent), `${player.name} should include prior-week price impact`);
    assert.ok(Number.isFinite(player.priorFormScore), `${player.name} should include a prior form score`);
    assert.ok(player.openingPriceBasis, `${player.name} should explain opening price basis`);
    assert.ok(player.reasonTags.includes("real boxscore"), `${player.name} should disclose real boxscore source`);
  }
});
