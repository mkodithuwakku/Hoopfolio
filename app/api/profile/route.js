import { getTestMarketSnapshot } from "@/src/data/providers/testMarketProvider.mjs";
import { getCurrentUser } from "@/src/data/persistence/localStore.mjs";

export async function GET() {
  const [user, snapshot] = await Promise.all([getCurrentUser(), getTestMarketSnapshot()]);

  return Response.json(
    {
      user,
      contest: snapshot.contest,
      portfolio: snapshot.portfolio,
      leaderboardRank: snapshot.leaderboard.find((row) => row.isCurrentUser) ?? null,
      historicalPortfolioSnapshots: []
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
