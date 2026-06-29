import { getTestMarketSnapshot } from "@/src/data/providers/testMarketProvider.mjs";

export async function GET() {
  const snapshot = await getTestMarketSnapshot();

  return Response.json(
    {
      contest: snapshot.contest,
      progress: snapshot.sim,
      leaderboard: snapshot.leaderboard,
      updatedFrom: snapshot.dataMode
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
