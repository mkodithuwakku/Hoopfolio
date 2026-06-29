import { resetTestMarket } from "@/src/data/providers/testMarketProvider.mjs";

export async function POST() {
  return Response.json(await resetTestMarket(), {
    headers: {
      "cache-control": "no-store"
    }
  });
}
