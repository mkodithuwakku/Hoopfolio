import { searchTestMarket } from "@/src/data/providers/testMarketProvider.mjs";

export async function GET(request) {
  const url = new URL(request.url);
  return Response.json(
    await searchTestMarket({
      query: url.searchParams.get("q") ?? "",
      sort: url.searchParams.get("sort") ?? "projectedReturnDesc"
    }),
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
