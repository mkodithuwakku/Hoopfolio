import { createGoogleDemoSession } from "@/src/data/persistence/localStore.mjs";

export async function POST() {
  return Response.json(await createGoogleDemoSession(), {
    headers: {
      "cache-control": "no-store"
    }
  });
}
