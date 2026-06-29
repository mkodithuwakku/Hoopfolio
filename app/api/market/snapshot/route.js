import { getTestMarketSnapshot } from "@/src/data/providers/testMarketProvider.mjs";

export async function GET() {
  return Response.json(await getTestMarketSnapshot(), {
    headers: {
      "cache-control": "no-store"
    }
  });
}
