import { buyTestStock } from "@/src/data/providers/testMarketProvider.mjs";

export async function POST(request) {
  try {
    const body = await request.json();
    return Response.json(
      await buyTestStock({
        playerId: body.playerId,
        amountCoins: body.amountCoins
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
        error: error.code ?? "BUY_FAILED",
        message: error.message
      },
      { status: 400 }
    );
  }
}
