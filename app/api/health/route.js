export async function GET() {
  return Response.json(
    {
      ok: true,
      app: "Hoopfolio",
      stack: "nextjs",
      dataMode: "local-cache",
      liveProviderCalls: false
    },
    {
      headers: {
        "cache-control": "no-store"
      }
    }
  );
}
