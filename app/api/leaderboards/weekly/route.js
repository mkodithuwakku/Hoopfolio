import { getTestMarketSnapshot } from "@/src/data/providers/testMarketProvider.mjs";

export async function GET() {
  const snapshot = await getTestMarketSnapshot();

  return Response.json(
    {
      contest: snapshot.contest,
      leaderboard: snapshot.leaderboard,
      settled: snapshot.sim.isSettled
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
