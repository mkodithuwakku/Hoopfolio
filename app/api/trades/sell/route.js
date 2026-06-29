import { sellTestStock } from "@/src/data/providers/testMarketProvider.mjs";

export async function POST(request) {
  try {
    const body = await request.json();
    return Response.json(
      await sellTestStock({
        playerId: body.playerId,
        shares: body.shares ?? "all"
      }),
      {
        headers: {
          "cache-control": "no-store"
        }
      }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error.code ?? "SELL_FAILED",
        message: error.message
      },
      { status: 400 }
    );
  }
}
