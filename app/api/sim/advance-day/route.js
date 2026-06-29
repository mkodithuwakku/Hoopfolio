import { advanceTestMarketDay } from "@/src/data/providers/testMarketProvider.mjs";

export async function POST() {
  return Response.json(await advanceTestMarketDay(), {
    headers: {
      "cache-control": "no-store"
    }
  });
}
