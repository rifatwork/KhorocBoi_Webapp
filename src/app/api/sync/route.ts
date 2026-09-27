import { guardJsonPost, json, readCredentials } from "../_lib/guard";
import { forwardToSyncServer } from "../_lib/proxy";

export const maxDuration = 30;

export async function POST(request: Request) {
  const guarded = await guardJsonPost(request, {
    bucket: "sync",
    limit: 60,
    windowMs: 60_000,
    maxBytes: 4 * 1024 * 1024,
  });
  if ("error" in guarded) return guarded.error;

  const credentials = readCredentials(guarded.body);
  if ("error" in credentials) return json({ error: credentials.error }, 400);

  const data = (guarded.body as { data?: unknown }).data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json({ error: "Backup data is missing or malformed" }, 400);
  }

  return forwardToSyncServer("/api/sync", { ...credentials, data });
}
