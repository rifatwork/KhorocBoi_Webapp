import { guardJsonPost, json, readCredentials } from "../_lib/guard";
import { forwardToSyncServer } from "../_lib/proxy";

export const maxDuration = 30;

export async function POST(request: Request) {
  const guarded = await guardJsonPost(request, {
    bucket: "restore",
    limit: 30,
    windowMs: 10 * 60_000,
    maxBytes: 2 * 1024,
  });
  if ("error" in guarded) return guarded.error;

  const credentials = readCredentials(guarded.body);
  if ("error" in credentials) return json({ error: credentials.error }, 400);

  return forwardToSyncServer("/api/restore", credentials);
}
