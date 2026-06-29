import { getCurrentUser } from "@/src/data/persistence/localStore.mjs";

export async function GET() {
  return Response.json({
    user: await getCurrentUser(),
    authMode: "local-file"
  });
}
